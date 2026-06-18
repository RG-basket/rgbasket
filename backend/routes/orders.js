const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const ServiceArea = require('../models/ServiceArea');
const TelegramService = require('../services/TelegramService');
const cache = require('../services/redis').cache;
const { authenticateAdmin, checkBanned } = require('../middleware/auth');

const OrderService = require('../services/OrderService');
const rateLimit = require('express-rate-limit');
const { deleteFromCloudinary } = require('../services/cloudinary');
const FirebaseAdminService = require('../services/firebaseAdmin');

const notifyUserOfStatusUpdate = async (order) => {
  const statusMessages = {
    'confirmed': 'Your order has been confirmed! 🛒',
    'processing': 'Your order is being prepared. 🛠️',
    'shipped': 'Your order is out for delivery! 🚚',
    'delivered': 'Order delivered! Enjoy your items. ✨',
    'cancelled': 'Your order has been cancelled. ❌'
  };

  const message = statusMessages[order.status];
  if (message) {
    await FirebaseAdminService.sendToUser(order.user, 'RG Basket Update', message, {
      path: `/orders`,
      orderId: order._id.toString()
    });
  }
};


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
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const status = req.query.status || 'all';

    console.log(`🔍 Fetching orders for user: ${userId} (page: ${page}, limit: ${limit}, status: ${status})`);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // 1. Find the user first to get both their MongoDB _id and googleId
    // This handles cases where some orders belong to googleId while others belong to _id
    const user = await User.findOne({
      $or: [
        { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null },
        { googleId: userId }
      ].filter(q => (q._id !== null && q._id !== undefined) || q.googleId !== undefined)
    });

    // 2. Build a list of all potential IDs associated with this user
    const userIds = [userId];
    if (user) {
      if (user._id) userIds.push(user._id.toString());
      if (user.googleId) userIds.push(user.googleId);
    }

    // 3. Find orders assigned to any of these IDs (deduplicated)
    const uniqueUserIds = [...new Set(userIds.filter(id => id))];

    // Build query conditions
    const queryConditions = { user: { $in: uniqueUserIds } };
    if (status && status !== 'all') {
      if (status === 'out for delivery') {
        queryConditions.status = 'shipped';
      } else {
        queryConditions.status = status;
      }
    }

    let query = Order.find(queryConditions)
      .populate('deliveryPartner', 'name phone')
      .sort({ createdAt: -1 });

    if (page) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const orders = await query;
    const total = await Order.countDocuments(queryConditions);

    // Get status counts for this specific user to keep the frontend filter badges updated
    const statusCounts = await Order.aggregate([
      { $match: { user: { $in: uniqueUserIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCountsMap = {
      all: await Order.countDocuments({ user: { $in: uniqueUserIds } }),
      confirmed: statusCounts.find(s => s._id === 'confirmed')?.count || 0,
      'out for delivery': statusCounts.find(s => s._id === 'shipped')?.count || 0,
      delivered: statusCounts.find(s => s._id === 'delivered')?.count || 0,
      cancelled: statusCounts.find(s => s._id === 'cancelled')?.count || 0
    };

    console.log(`📦 Found ${orders.length} orders for user ${userId} (checked ${uniqueUserIds.length} ID variants). Total matches: ${total}`);

    res.json({
      success: true,
      orders: orders || [],
      total,
      statusCounts: statusCountsMap,
      hasMore: page ? (page * limit < total) : false
    });

  } catch (error) {
    console.error('💥 Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user orders: ' + error.message
    });
  }
});

// Bulk update order status (for admin)
router.put('/admin/orders/bulk-status', authenticateAdmin, async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    console.log(`🔄 Bulk updating ${orderIds?.length} orders status to:`, status);

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order IDs provided'
      });
    }

    const results = [];
    const errors = [];

    // Import required services if status is 'cancelled'
    let orderSvc, promoModel;
    if (status === 'cancelled') {
      orderSvc = require('../services/OrderService');
      promoModel = require('../models/PromoCode');
    }

    for (const orderId of orderIds) {
      try {
        const oldOrder = await Order.findById(orderId);
        if (!oldOrder) {
          errors.push({ orderId, message: 'Order not found' });
          continue;
        }

        const updateData = { status };
        if (status === 'delivered') {
          updateData.deliveredAt = new Date();
        }

        // --- RESET PROCESS LOGIC ---
        if (oldOrder.status === 'delivered' && status !== 'delivered') {
          // Physical deletion to save storage
          if (oldOrder.proofOfDelivery?.image) {
            await deleteFromCloudinary(oldOrder.proofOfDelivery.image);
          }

          updateData.deliveredAt = null;
          updateData.proofOfDelivery = {
            image: '',
            capturedAt: null,
            location: oldOrder.proofOfDelivery?.location || null,
            isForcefullyDelivered: false
          };
        }

        // Handle Stock, Promo & Coins reversion if status is changing TO 'cancelled' from a non-cancelled status
        if (status === 'cancelled' && oldOrder.status !== 'cancelled') {
          try {
            const CoinService = require('../services/CoinService');

            // 1. Revert Stock
            const itemsToRevert = oldOrder.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity
            }));
            if (itemsToRevert.length > 0) {
              await orderSvc.updateProductInventory(itemsToRevert, 'increment');
            }

            // 2. Revert Promo Usage
            if (oldOrder.promoCode) {
              await promoModel.revertUsageAtomic(oldOrder.promoCode, oldOrder.user, orderId);
            }

            // 3. Revert Earned Coins (removal)
            if (oldOrder.coinsEarned > 0) {
              await CoinService.revertEarnedCoins(oldOrder);
            }

            // 4. Refund Spent Coins
            if (oldOrder.coinsUsed > 0) {
              await CoinService.revertSpentCoins(oldOrder);
            }

            // 5. RECURSIVE REVERSAL: Claw back referral bonuses
            await CoinService.revertReferralBonus(orderId);

            // 6. Send Telegram Notification
            TelegramService.sendOrderCancellationNotification(oldOrder, 'Cancelled by Admin (Bulk Update)').catch(() => { });
          } catch (ResourceError) {
            console.error(`[Bulk-Admin] Resource reversion failed for ${orderId}:`, ResourceError.message);
          }
        }

        const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });

        // Award RG Coins if marking as delivered and NOT already earned
        if (status === 'delivered' && (!updatedOrder.coinsEarned || updatedOrder.coinsEarned === 0)) {
          const CoinService = require('../services/CoinService');
          await CoinService.awardOrderCoins(updatedOrder).catch(e => console.error('[Bulk] Coin award failed'));
        }

        results.push(orderId);
      } catch (err) {
        console.error(`Error in bulk update for order ${orderId}:`, err);
        errors.push({ orderId, message: err.message });
      }
    }

    res.json({
      success: true,
      message: `Successfully updated ${results.length} orders. ${errors.length} failed.`,
      updatedCount: results.length,
      failedCount: errors.length,
      errors
    });

  } catch (error) {
    console.error('💥 Error in bulk order status update:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk order status update: ' + error.message
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
      .populate('deliveryPartner', 'name phone')
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

    const oldOrder = await Order.findById(orderId);
    if (!oldOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updateData = { status };

    // If marking as delivered, set deliveredAt timestamp
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    // --- RESET PROCESS LOGIC ---
    // If moving AWAY from delivered, clear the proof and completion data 
    // This ensures the Rider Portal "Resets the process" as requested.
    if (oldOrder.status === 'delivered' && status !== 'delivered') {
      // Physical deletion to save storage
      if (oldOrder.proofOfDelivery?.image) {
        await deleteFromCloudinary(oldOrder.proofOfDelivery.image);
      }

      updateData.deliveredAt = null;
      updateData.proofOfDelivery = {
        image: '',
        capturedAt: null,
        location: oldOrder.proofOfDelivery?.location || null,
        isForcefullyDelivered: false
      };
      console.log(`[Admin] Resetting delivery data and deleting Cloudinary image for order ${orderId}`);
    }

    // Handle Stock, Promo & Coins reversion if status is changing TO 'cancelled' from a non-cancelled status
    if (status === 'cancelled' && oldOrder.status !== 'cancelled') {
      try {
        const OrderService = require('../services/OrderService');
        const PromoCode = require('../models/PromoCode');
        const CoinService = require('../services/CoinService');

        // 1. Revert Stock
        const itemsToRevert = oldOrder.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
        if (itemsToRevert.length > 0) {
          await OrderService.updateProductInventory(itemsToRevert, 'increment');
          console.log(`[Admin] Reverted stock for cancelled order ${orderId}`);
        }

        // 2. Revert Promo Usage
        if (oldOrder.promoCode) {
          await PromoCode.revertUsageAtomic(oldOrder.promoCode, oldOrder.user, orderId);
          console.log(`[Admin] Reverted promo usage for cancelled order ${orderId}`);
        }

        // 3. Revert Earned Coins (Cashback removal)
        if (oldOrder.coinsEarned > 0) {
          await CoinService.revertEarnedCoins(oldOrder);
          console.log(`[Admin] Reverted earned coins for cancelled order ${orderId}`);
        }

        // 4. Refund Spent Coins (Redemption refund)
        if (oldOrder.coinsUsed > 0) {
          await CoinService.revertSpentCoins(oldOrder);
          console.log(`[Admin] Refunded spent coins for cancelled order ${orderId}`);
        }

        // 5. RECURSIVE REVERSAL: Claw back referral bonuses
        await CoinService.revertReferralBonus(orderId);
      } catch (err) {
        console.error('[Admin] Resource reversion failed during cancellation:', err);
      }
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    console.log(`✅ Order ${orderId} status updated to:`, status);

    // Award RG Coins if marking as delivered and NOT already earned
    if (status === 'delivered' && (!order.coinsEarned || order.coinsEarned === 0)) {
      try {
        const CoinService = require('../services/CoinService');
        await CoinService.awardOrderCoins(order);
        console.log(`[Admin] Awarded RG coins for order ${orderId}`);
      } catch (coinErr) {
        console.error('[Admin] Coin awarding failed:', coinErr.message);
      }
    }

    // Send Telegram notification if order was cancelled
    if (status === 'cancelled') {
      TelegramService.sendOrderCancellationNotification(order, 'Cancelled by Admin').catch(err => {
        console.error('Failed to send admin cancellation telegram msg:', err.message);
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

    // Notify user of status update
    notifyUserOfStatusUpdate(order).catch(e => console.error('Notification failed:', e));


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

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Recalculate totals if items are updated
    if (updateData.items && Array.isArray(updateData.items)) {
      const rawSubtotal = updateData.items.reduce((sum, item) => sum + (item.price * item.quantity + (item.customizationCharge || 0)), 0);
      updateData.subtotal = Math.round(rawSubtotal * 100) / 100;

      const discount = Math.round((updateData.discountAmount || 0) * 100) / 100;
      updateData.discountAmount = discount;

      const coinDiscount = Math.round((updateData.coinDiscount !== undefined ? updateData.coinDiscount : (existingOrder.coinDiscount || 0)) * 100) / 100;
      const coinDebtRecovery = Math.round((updateData.coinDebtRecovery !== undefined ? updateData.coinDebtRecovery : (existingOrder.coinDebtRecovery || 0)) * 100) / 100;

      const netValue = updateData.subtotal - discount - coinDiscount + coinDebtRecovery;

      // Calculate shipping if not explicitly provided
      if (updateData.shippingFee === undefined) {
        let shippingFee = 29;
        let freeAbove = 299;

        const pincode = updateData.shippingAddress?.pincode || existingOrder.shippingAddress?.pincode;
        if (pincode) {
          const area = await ServiceArea.findOne({ pincode, isActive: true });
          if (area) {
            shippingFee = area.deliveryCharge ?? 29;
            freeAbove = area.minOrderForFreeDelivery ?? 299;
          }
        }

        updateData.shippingFee = (updateData.subtotal > 0 && netValue < freeAbove) ? Math.round(shippingFee * 100) / 100 : 0;
      }

      const tipAmount = Math.round((updateData.tipAmount !== undefined ? updateData.tipAmount : (existingOrder.tipAmount || 0)) * 100) / 100;
      const taxAmount = Math.round((updateData.tax || 0) * 100) / 100;

      let calculatedTotal = (updateData.subtotal + (updateData.shippingFee || 0) + taxAmount + tipAmount - discount - coinDiscount + coinDebtRecovery);
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

    // Send Telegram notification if order was cancelled in this full update
    if (updateData.status === 'cancelled') {
      TelegramService.sendOrderCancellationNotification(order, 'Cancelled by Admin (Full Update)').catch(err => {
        console.error('Failed to send full update cancellation telegram msg:', err.message);
      });
    }

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

    const OrderService = require('../services/OrderService');

    // Check if order exists before calling service to retain old error messages
    const orderExists = await Order.findById(orderId);
    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Call OrderService to handle cancellation and resource reversion (Coins, Stock, Promo)
    const cancelledOrder = await OrderService.cancelOrder(orderId, orderExists.user, cancelReason);

    console.log(`✅ Order ${orderId} cancelled successfully via OrderService. Sending Telegram...`);

    // Send Telegram notification for cancellation
    TelegramService.sendOrderCancellationNotification(cancelledOrder, cancelReason || 'User cancelled').catch(err => {
      console.error('❌ CRITICAL: Failed to send cancellation telegram msg:', err.message);
    });

    console.log(`🚀 Telegram trigger fired for order ${orderId}`);

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: cancelledOrder,
    });

    // Notify user
    notifyUserOfStatusUpdate(cancelledOrder).catch(e => console.error('Notification failed:', e));

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

    // Award RG Coins for delivery if NOT already earned
    if (!order.coinsEarned || order.coinsEarned === 0) {
      try {
        const CoinService = require('../services/CoinService');
        await CoinService.awardOrderCoins(order);
        console.log(`[User] Awarded RG coins for self-confirmed order ${orderId}`);
      } catch (coinErr) {
        console.error('[User] Coin awarding failed:', coinErr.message);
      }
    }

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

// Delete order completely (for admin)
router.delete('/admin/orders/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`🗑️ Admin deleting order ${orderId}`);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Optional: Revert resources if order wasn't already cancelled
    if (order.status !== 'cancelled') {
      try {
        const OrderService = require('../services/OrderService');
        const PromoCode = require('../models/PromoCode');

        // Revert Stock
        const itemsToRevert = order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
        if (itemsToRevert.length > 0) {
          await OrderService.updateProductInventory(itemsToRevert, 'increment');
        }

        // Revert Promo Usage
        if (order.promoCode) {
          await PromoCode.revertUsageAtomic(order.promoCode, order.user, orderId);
        }

        // Delete Proof Image if exists to save storage
        if (order.proofOfDelivery?.image) {
          await deleteFromCloudinary(order.proofOfDelivery.image);
        }
      } catch (revertErr) {
        console.error('[Admin] Resource reversion failed during deletion:', revertErr);
      }
    }

    await Order.findByIdAndDelete(orderId);

    res.json({
      success: true,
      message: 'Order deleted completely from database'
    });

  } catch (error) {
    console.error('💥 Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order: ' + error.message
    });
  }
});

module.exports = router;
