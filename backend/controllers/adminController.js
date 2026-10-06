const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const safeCompare = (a, b) => {
  try {
    return crypto.timingSafeEqual(Buffer.from(String(a)), Buffer.from(String(b)));
  } catch {
    return false;
  }
};

const adminLogin = async (req, res) => {
  try {
    const { adminId, password } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // 1. Log decoy honeypot probe
    console.warn(`🚨 SECURITY TRIPWIRE TRIGGERED: Honeypot login attempt from IP: ${ipAddress}`);
    console.warn(`Details: User Agent: ${userAgent} | Attempted Admin ID: ${adminId || 'N/A'} | Attempted Password: [REDACTED]`);

    // 2. Immediately return a fake rejection (no DB, no CPU-heavy operations)
    res.status(401).json({
      success: false,
      message: 'Invalid credentials. Attempt logged.'
    });
  } catch (error) {
    console.error('Error in honeypot handler:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      recentOrders,
      topSellingProducts,
      topCustomers,
      slotBreakdown,
      orderingUsers
    ] = await Promise.all([
      // 1. Total Revenue
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'Cancelled'] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]).catch(() => []),

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
                status: { $nin: ['cancelled', 'Cancelled'] }
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
        .limit(8)
        .select('_id user userInfo totalAmount status createdAt items deliveryDate timeSlot')
        .catch(() => []),

      // 8. Top Selling Products (Most Selling Items)
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'Cancelled'] } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            productId: { $first: "$items.productId" },
            image: { $first: "$items.image" },
            weight: { $first: "$items.weight" },
            unit: { $first: "$items.unit" },
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 20 }
      ]).catch(() => []),

      // 9. Top Customers (Who Order Most - Top 100)
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'Cancelled'] } } },
        {
          $group: {
            _id: "$user",
            name: { $first: "$userInfo.name" },
            email: { $first: "$userInfo.email" },
            phone: { $first: "$userInfo.phone" },
            photo: { $first: "$userInfo.photo" },
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$totalAmount" },
            lastOrderDate: { $max: "$createdAt" }
          }
        },
        { $sort: { totalOrders: -1, totalSpent: -1 } },
        { $limit: 100 }
      ]).catch(() => []),

      // 10. Delivery Time Slot Breakdown
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'Cancelled'] } } },
        {
          $group: {
            _id: "$timeSlot",
            count: { $sum: 1 },
            revenue: { $sum: "$totalAmount" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]).catch(() => []),

      // 11. Ordering Users Count
      Order.distinct('user').catch(() => [])
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
      totalOrderedUsers: Array.isArray(orderingUsers) ? orderingUsers.length : 0,
      totalNotOrderedUsers: Math.max(0, (totalUsers || 0) - (Array.isArray(orderingUsers) ? orderingUsers.length : 0)),
      orders,
      revenueChart: formattedRevenueChart,
      recentOrders: recentOrders || [],
      topSellingProducts: topSellingProducts || [],
      topCustomers: topCustomers || [],
      slotBreakdown: slotBreakdown || []
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