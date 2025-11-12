const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const cache = require('../services/redis').cache;
const { authenticateAdmin } = require('../middleware/auth');
// Create new order from cart
router.post('/', async (req, res) => {
  try {
    console.log('🔍 Order creation request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      items, 
      shippingAddress, 
      paymentMethod = 'cash_on_delivery', 
      deliveryDate, 
      timeSlot,
      userId,
      userInfo
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    console.log('📦 Items received:', items);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = 29;
    const tax = 0;
    const totalAmount = subtotal + shippingFee + tax;

    console.log('💰 Calculated totals:', { subtotal, shippingFee, totalAmount });

    // Create order with user information
    const order = new Order({
      user: userId || 'guest_user',
      userInfo: userInfo || {
        name: 'Guest',
        email: '',
        photo: '',
        phone: shippingAddress?.phoneNumber || ''
      },
      items: items.map(item => ({
        ...item,
        userName: item.userName || userInfo?.name || 'Guest',
        userImage: item.userImage || userInfo?.photo || ''
      })),
      subtotal,
      shippingFee,
      tax,
      totalAmount,
      shippingAddress,
      paymentMethod,
      deliveryDate: new Date(deliveryDate),
      timeSlot
    });

    console.log('💾 Saving order to database...');
    const savedOrder = await order.save();
    console.log('✅ Order saved successfully:', savedOrder._id);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: savedOrder
    });

  } catch (error) {
    console.error('💥 ORDER CREATION ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order: ' + error.message
    });
  }
});

// GET ORDERS FOR SPECIFIC USER
router.get('/user/:userId',async (req, res) => {
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
router.get('/admin/orders', authenticateAdmin,async (req, res) => {
  try {
    console.log('🔍 Admin: Fetching all orders');
    
    const orders = await Order.find()
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${orders.length} total orders`);

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
router.put('/admin/orders/:orderId/status', async (req, res) => {
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

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
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

module.exports = router;