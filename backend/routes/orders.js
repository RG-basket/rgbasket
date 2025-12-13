const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const cache = require('../services/redis').cache;
const { authenticateAdmin } = require('../middleware/auth');

const OrderService = require('../services/OrderService');

// Create new order from cart
router.post('/', async (req, res) => {
  try {
    console.log('🔍 Order creation request body:', JSON.stringify(req.body, null, 2));

    // Use OrderService to handle creation, validation, pricing, and promo codes
    const order = await OrderService.createOrder(req.body, req.body.userId);

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
router.get('/user/:userId', async (req, res) => {
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

// Get all orders (for admin) - FIXED VERSION
router.get('/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Admin: Fetching all orders');

    const orders = await Order.find()
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${orders.length} total orders`);
    console.log(`📍 Orders with location data: ${orders.filter(order => order.location?.coordinates).length}`);

    res.json({
      success: true,
      orders,
      total: orders.length
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
      updateData.subtotal = updateData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      updateData.totalAmount = updateData.subtotal + (updateData.shippingFee || 29) + (updateData.tax || 0);
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
router.put("/:orderId/cancel", async (req, res) => {
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