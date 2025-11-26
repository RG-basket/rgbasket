const jwt = require('jsonwebtoken');

const adminLogin = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    // Validate credentials against environment variables
    if (adminId !== process.env.ADMIN_ID || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        message: 'Invalid admin credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: adminId,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: {
        id: adminId,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      message: 'Internal server error during admin login'
    });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    // Import models with error handling
    let Order, Product, User;
    try {
      Order = require('../models/Order');
      Product = require('../models/Product');
      User = require('../models/User');
    } catch (modelError) {
      console.error('Model import error:', modelError);
      return res.status(500).json({
        message: 'Database models not found'
      });
    }

    // Execute all database queries in parallel for better performance
    const [
      revenueResult,
      totalOrders,
      totalProducts,
      totalUsers,
      orderStats,
      revenueChart,
      recentOrders
    ] = await Promise.all([
      // 1. Total Revenue
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]).catch(() => []), // Return empty array on error

      // 2. Total Orders
      Order.countDocuments().catch(() => 0),

      // 3. Total Products
      Product.countDocuments().catch(() => 0),

      // 4. Total Users
      User.countDocuments().catch(() => 0),

      // 5. Order Status Breakdown
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]).catch(() => []),

      // 6. Revenue Chart (Last 7 Days)
      (async () => {
        try {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0); // Start of day

          return await Order.aggregate([
            {
              $match: {
                createdAt: { $gte: sevenDaysAgo },
                status: { $ne: 'Cancelled' }
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalAmount: { $sum: "$totalAmount" }
              }
            },
            { $sort: { _id: 1 } }
          ]);
        } catch (error) {
          console.error('Revenue chart error:', error);
          return [];
        }
      })(),

      // 7. Recent Orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .catch(() => [])
    ]);

    // Process revenue with safe default
    const totalRevenue = revenueResult && revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Process order status with safe defaults
    const orders = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    if (orderStats && Array.isArray(orderStats)) {
      orderStats.forEach(stat => {
        if (stat && stat._id) {
          const statusKey = stat._id.toLowerCase();
          if (orders.hasOwnProperty(statusKey)) {
            orders[statusKey] = stat.count || 0;
          } else if (stat._id === 'Order Placed') {
            orders.pending = stat.count || 0;
          }
        }
      });
    }

    // Ensure revenueChart has proper format
    const formattedRevenueChart = Array.isArray(revenueChart) ? revenueChart : [];

    res.status(200).json({
      success: true,
      totalRevenue,
      totalOrders: totalOrders || 0,
      totalProducts: totalProducts || 0,
      totalUsers: totalUsers || 0,
      orders,
      revenueChart: formattedRevenueChart,
      recentOrders: recentOrders || []
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  adminLogin,
  getAdminDashboard
};