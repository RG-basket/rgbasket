const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const ServiceArea = require('../models/ServiceArea');
const TelegramService = require('../services/TelegramService');
const cache = require('../services/redis').cache;
const { authenticateAdmin, checkBanned } = require('../middleware/auth');

const OrderService = require('../services/OrderService');
const rateLimit = require('express-rate-limit');

// Strict limiting for order placement
const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 orders per minute
  message: {
    success: false,
    message: 'Too many orders placed from this IP. Please wait a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create new order from cart
router.post('/', orderLimiter, checkBanned, async (req, res) => {
  try {
    console.log('🔍 Order creation request body:', JSON.stringify(req.body, null, 2));

    // Use OrderService to handle creation, validation, pricing, and promo codes
    const order = await OrderService.createOrder(req.body, req.body.userId);

    // Update user activity heartbeat
    try {
      const User = require('../models/User');
      await User.findOneAndUpdate(
        { $or: [{ _id: req.body.userId }, { googleId: req.body.userId }] },
        { lastActive: new Date() }
      );
    } catch (heartbeatError) {
      console.log('Heartbeat update failed (non-critical):', heartbeatError.message);
    }

    console.log('✅ Order created via OrderService:', order.id);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: order
    });

  } catch (error) {
    console.error('💥 ORDER CREATION ERROR:', error);
    // Handle specific AppError status codes if available, else 500
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error creating order'
    });
  }
});

// GET ORDERS FOR SPECIFIC USER
router.get('/user/:userId', checkBanned, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔍 Fetching orders for user:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${orders.length} orders for user ${userId}`);

    res.json({
      success: true,
      orders: orders || [],
      total: orders.length
    });

  } catch (error) {
    console.error('💥 Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user orders: ' + error.message
    });
  }
});

// Get all orders (for admin) - WITH PAGINATION
router.get('/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const date = req.query.date || '';
    const deliveryDate = req.query.deliveryDate || '';

    let query = {};

    // Status Filter
    if (status !== 'all') {
      query.status = status;
    }

    // Date Filter
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Delivery Date Filter
    if (deliveryDate) {
      const startDate = new Date(deliveryDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(deliveryDate);
      endDate.setHours(23, 59, 59, 999);
      query.deliveryDate = { $gte: startDate, $lte: endDate };
    }

    // Search Filter
    if (search) {
      const searchConditions = [
        { 'userInfo.name': { $regex: search, $options: 'i' } },
        { 'userInfo.email': { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phoneNumber': { $regex: search, $options: 'i' } }
      ];

      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        searchConditions.push({ _id: search });
      }

      // If we already have query filters, we need to combine them with $and
      if (Object.keys(query).length > 0) {
        query = { $and: [query, { $or: searchConditions }] };
      } else {
        query = { $or: searchConditions };
      }
    }

    console.log(`🔍 Admin: Fetching orders page ${page}, limit ${limit}, filters applied`);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    // Get status counts for the stats cards
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCountsMap = {
      all: await Order.countDocuments(),
      pending: statusCounts.find(s => s._id === 'pending')?.count || 0,
      confirmed: statusCounts.find(s => s._id === 'confirmed')?.count || 0,
      processing: statusCounts.find(s => s._id === 'processing')?.count || 0,
      shipped: statusCounts.find(s => s._id === 'shipped')?.count || 0,
      delivered: statusCounts.find(s => s._id === 'delivered')?.count || 0,
      cancelled: statusCounts.find(s => s._id === 'cancelled')?.count || 0
    };

    console.log(`📦 Found ${orders.length} orders for current page`);

    res.json({
      success: true,
      orders,
      statusCounts: statusCountsMap,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: (skip + orders.length) < total
      }
    });
  } catch (error) {
    console.error('💥 Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders: ' + error.message
    });
  }
});

// Update order status (for admin)
router.put('/admin/orders/:orderId/status', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`🔄 Updating order ${orderId} status to:`, status);

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = { status };

    // If marking as delivered, set deliveredAt timestamp
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log(`✅ Order ${orderId} status updated to:`, status);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('💥 Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status: ' + error.message
    });
  }
});

// Update entire order (for admin)
router.put('/admin/orders/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;

    console.log(`🔄 Admin updating order ${orderId}`);

    // Recalculate totals if items are updated
    if (updateData.items && Array.isArray(updateData.items)) {
      updateData.subtotal = updateData.items.reduce((sum, item) => sum + (item.price * item.quantity + (item.customizationCharge || 0)), 0);
      const discount = updateData.discountAmount || 0;
      const netValue = updateData.subtotal - discount;

      // Calculate shipping if not explicitly provided
      if (updateData.shippingFee === undefined) {
        let shippingFee = 29;
        let freeAbove = 299;

        const pincode = updateData.shippingAddress?.pincode || (await Order.findById(orderId))?.shippingAddress?.pincode;
        if (pincode) {
          const area = await ServiceArea.findOne({ pincode, isActive: true });
          if (area) {
            shippingFee = area.deliveryCharge ?? 29;
            freeAbove = area.minOrderForFreeDelivery ?? 299;
          }
        }

        updateData.shippingFee = netValue >= freeAbove ? 0 : shippingFee;
      }

      const tipAmount = updateData.tipAmount || (await Order.findById(orderId))?.tipAmount || 0;
      updateData.subtotal = Math.round(updateData.subtotal * 100) / 100;
      let calculatedTotal = (updateData.subtotal + (updateData.shippingFee || 0) + (updateData.tax || 0) + tipAmount - discount);
      updateData.totalAmount = Math.max(0, Math.round(calculatedTotal * 100) / 100);
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log(`✅ Order ${orderId} updated successfully`);

    res.json({
      success: true,
      message: 'Order updated successfully',
      order
    });

  } catch (error) {
    console.error('💥 Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order: ' + error.message
    });
  }
});

// Cancel order (for users)
router.put("/:orderId/cancel", checkBanned, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, cancelReason } = req.body;

    console.log(`❌ Cancelling order ${orderId}`);
    console.log("Cancel reason:", cancelReason);

    // Validate request
    if (status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: "Invalid status for cancellation",
      });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.status}`,
      });
    }

    // Update the order status
    order.status = 'cancelled';

    // Add cancellation reason if provided
    if (cancelReason) {
      order.cancelReason = cancelReason;
    }

    // Set cancelled timestamp
    order.cancelledAt = new Date();

    await order.save();

    console.log(`✅ Order ${orderId} cancelled successfully`);

    // Send Telegram notification for cancellation
    TelegramService.sendOrderCancellationNotification(order, cancelReason || 'User cancelled').catch(err => {
      console.error('Failed to send cancellation telegram msg:', err.message);
    });

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("💥 Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling order: " + error.message,
    });
  }
});

// Update order status (for users - mark as delivered only)
router.put('/:orderId/delivered', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`🔄 User marking order ${orderId} as delivered`);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow changing from shipped to delivered
    if (order.status !== 'shipped') {
      return res.status(400).json({
        success: false,
        message: 'Can only mark shipped orders as delivered'
      });
    }

    // Update the order
    order.status = 'delivered';
    order.deliveredAt = new Date();

    await order.save();

    console.log(`✅ User confirmed delivery for order ${orderId}`);

    res.json({
      success: true,
      message: 'Order marked as delivered successfully',
      order
    });

  } catch (error) {
    console.error('💥 Error marking order as delivered:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order: ' + error.message
    });
  }
});

// Get single order details
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`🔍 Fetching order details: ${orderId}`);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('💥 Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order: ' + error.message
    });
  }
});

module.exports = router;