const express = require('express');
const router = express.Router();
const { adminLogin, getAdminDashboard } = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');
const { uploadBannerImage } = require('../middleware/upload');
const CoinService = require('../services/CoinService');
const User = require('../models/User'); 
const Order = require('../models/Order');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

// Public route - Admin login
router.post('/login', adminLogin);

// Protected routes - Require admin authentication
router.get('/dashboard', authenticateAdmin, getAdminDashboard);

// User Management with Pagination and Optimization
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const filter = req.query.filter || 'all';

    // Fetch unique users who have placed orders
    const orderUserKeys = await Order.distinct('user');
    const validObjectIds = orderUserKeys
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const orderedUsers = await User.find({
      $or: [
        { _id: { $in: validObjectIds } },
        { googleId: { $in: orderUserKeys } }
      ]
    }).select('_id');
    const orderedUserObjectIds = orderedUsers.map(u => u._id);

    const andConditions = [];
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (filter === 'ordered') {
      andConditions.push({ _id: { $in: orderedUserObjectIds } });
    } else if (filter === 'not_ordered' || filter === 'never_ordered') {
      andConditions.push({ _id: { $nin: orderedUserObjectIds } });
    } else if (filter === 'online') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      andConditions.push({ lastActive: { $gte: fiveMinutesAgo } });
    } else if (filter === 'dau') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      andConditions.push({ lastActive: { $gte: twentyFourHoursAgo } });
    } else if (filter === 'no_phone') {
      andConditions.push({
        $or: [
          { phone: "" },
          { phone: { $exists: false } },
          { phone: null }
        ]
      });
    } else if (filter === 'any_phone') {
      andConditions.push({ phone: { $ne: "", $exists: true } });
    } else if (filter === 'both_email_phone') {
      andConditions.push({ email: { $ne: "", $exists: true }, phone: { $ne: "", $exists: true } });
    } else if (filter === 'only_email') {
      andConditions.push({
        email: { $ne: "", $exists: true },
        $or: [
          { phone: "" },
          { phone: { $exists: false } },
          { phone: null }
        ]
      });
    } else if (filter === 'admins') {
      andConditions.push({
        $or: [
          { role: 'admin' },
          { isAdmin: true }
        ]
      });
    }

    const baseFilter = andConditions.length > 0 ? { $and: andConditions } : {};

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await User.aggregate([
      {
        $facet: {
          users: [
            { $match: baseFilter },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'useraddresses',
                let: { userIdStr: { $toString: '$_id' }, googleId: '$googleId' },
                pipeline: [
                  { $match: { $expr: { $or: [{ $eq: ['$user', '$$userIdStr'] }, { $eq: ['$user', '$$googleId'] }] } } },
                  { $sort: { isDefault: -1, createdAt: -1 } }
                ],
                as: 'addresses'
              }
            },
            {
              $lookup: {
                from: 'orders',
                let: { userIdStr: { $toString: '$_id' }, googleId: '$googleId' },
                pipeline: [
                  { $match: { $expr: { $or: [{ $eq: ['$user', '$$userIdStr'] }, { $eq: ['$user', '$$googleId'] }] } } },
                  { $sort: { createdAt: -1 } }
                ],
                as: 'orders'
              }
            },
            {
              $project: {
                name: 1, email: 1, phone: 1, role: 1, active: 1, isBanned: 1, photo: 1, 
                createdAt: 1, lastActive: 1, addresses: 1, orders: 1, orderCount: { $size: '$orders' },
                rgCoins: 1, referralCode: 1, referredBy: 1,
                lastCartSnapshot: 1, lastBrowsedCategory: 1, browsingActivity: 1,
                pushToken: 1, pushTokens: 1
              }
            }
          ],
          pagination: [
            { $match: baseFilter },
            { $count: 'total' }
          ],
          stats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                onlineNow: { $sum: { $cond: [{ $gte: ['$lastActive', fiveMinutesAgo] }, 1, 0] } },
                dau: { $sum: { $cond: [{ $gte: ['$lastActive', twentyFourHoursAgo] }, 1, 0] } },
                totalAdmins: { $sum: { $cond: [{ $or: [{ $eq: ['$role', 'admin'] }, { $eq: ['$isAdmin', true] }] }, 1, 0] } }
              }
            }
          ]
        }
      }
    ]);

    const users = result[0].users || [];
    const totalFiltered = result[0].pagination[0]?.total || 0;
    const globalStats = result[0].stats[0] || { total: 0, onlineNow: 0, dau: 0, totalAdmins: 0 };
    const totalOrdered = orderedUserObjectIds.length;
    const totalNotOrdered = Math.max(0, (globalStats.total || 0) - totalOrdered);

    res.json({ 
      success: true, 
      users, 
      pagination: { 
        total: totalFiltered, 
        page, 
        limit, 
        pages: Math.ceil(totalFiltered / limit),
        hasMore: skip + users.length < totalFiltered
      },
      stats: {
        total: globalStats.total,
        onlineNow: globalStats.onlineNow,
        dau: globalStats.dau,
        totalAdmins: globalStats.totalAdmins,
        totalOrdered,
        totalNotOrdered
      }
    });
  } catch (error) {
    console.error('Error in /api/admin/users aggregation:', error);
    res.status(500).json({ success: false, message: 'Error fetching users and statistics' });
  }
});

// Comprehensive User Analytics (Ordered vs Never Ordered, Conversion, Frequency)
router.get('/users/analytics', authenticateAdmin, async (req, res) => {
  try {
    const orderUserKeys = await Order.distinct('user');
    const validObjectIds = orderUserKeys
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const [totalUsers, customerOrderStats, matchedUsers, usersWithPhone] = await Promise.all([
      User.countDocuments(),
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'Cancelled'] } } },
        {
          $group: {
            _id: "$user",
            orderCount: { $sum: 1 },
            totalSpent: { $sum: "$totalAmount" },
            lastOrderDate: { $max: "$createdAt" }
          }
        }
      ]),
      User.find({
        $or: [
          { _id: { $in: validObjectIds } },
          { googleId: { $in: orderUserKeys } }
        ]
      }).select('_id googleId phone email'),
      User.countDocuments({ phone: { $ne: "", $exists: true } })
    ]);

    const orderedUserCount = matchedUsers.length;
    const neverOrderedUserCount = Math.max(0, totalUsers - orderedUserCount);

    let singleOrderCount = 0;
    let repeat2to4Count = 0;
    let repeat5to9Count = 0;
    let vip10PlusCount = 0;
    let totalOrderSpend = 0;

    customerOrderStats.forEach(stat => {
      totalOrderSpend += stat.totalSpent || 0;
      if (stat.orderCount === 1) singleOrderCount++;
      else if (stat.orderCount >= 2 && stat.orderCount <= 4) repeat2to4Count++;
      else if (stat.orderCount >= 5 && stat.orderCount <= 9) repeat5to9Count++;
      else if (stat.orderCount >= 10) vip10PlusCount++;
    });

    const repeatCustomers = Math.max(0, orderedUserCount - singleOrderCount);
    const usersEmailOnly = Math.max(0, totalUsers - usersWithPhone);
    const conversionRate = totalUsers > 0 ? ((orderedUserCount / totalUsers) * 100).toFixed(1) : 0;
    const totalOrderCount = customerOrderStats.reduce((acc, c) => acc + (c.orderCount || 0), 0);
    const avgOrderValue = totalOrderCount > 0 ? Math.round(totalOrderSpend / totalOrderCount) : 0;
    const avgCustomerSpend = orderedUserCount > 0 ? Math.round(totalOrderSpend / orderedUserCount) : 0;

    res.json({
      success: true,
      analytics: {
        totalUsers,
        orderedUserCount,
        neverOrderedUserCount,
        conversionRate: parseFloat(conversionRate),
        singleOrderCount,
        repeatCustomers,
        repeatRate: orderedUserCount > 0 ? parseFloat(((repeatCustomers / orderedUserCount) * 100).toFixed(1)) : 0,
        frequencyBreakdown: {
          single: singleOrderCount,
          tier2to4: repeat2to4Count,
          tier5to9: repeat5to9Count,
          tier10Plus: vip10PlusCount
        },
        financials: {
          totalOrderSpend: Math.round(totalOrderSpend),
          totalOrderCount,
          avgOrderValue,
          avgCustomerSpend
        },
        reachability: {
          usersWithPhone,
          usersEmailOnly
        }
      }
    });
  } catch (error) {
    console.error('Error in /api/admin/users/analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate user analytics' });
  }
});

// Search user by email or phone for coin adjustment
router.get('/users/search', authenticateAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const { query } = req.query;
    if (!query) return res.status(400).json({ success: false, message: 'Search query is required' });

    const user = await User.findOne({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).select('name email phone rgCoins');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching user' });
  }
});

// Get users sorted by coin balance (top holders)
router.get('/users/top-coins', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({ rgCoins: { $gt: 0 } })
      .select('name email phone rgCoins photo')
      .sort({ rgCoins: -1 })
      .limit(50);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching top coin holders' });
  }
});
// RG Coin Management Routes
router.get('/reward-settings', authenticateAdmin, async (req, res) => {
  try {
    const RewardConfig = require('../models/RewardConfig');
    const settings = await RewardConfig.find();
    
    // Self-healing: Ensure signupBonusCoins exists
    const hasSignupBonus = settings.some(s => s.key === 'signupBonusCoins');
    if (!hasSignupBonus) {
      const newConfig = new RewardConfig({
        key: 'signupBonusCoins',
        value: 100,
        description: 'Welcome bonus for new signups'
      });
      await newConfig.save();
      settings.push(newConfig);
    }

    const hasRefereeBonus = settings.some(s => s.key === 'refereeBonusCoins');
    if (!hasRefereeBonus) {
      const newConfig = new RewardConfig({
        key: 'refereeBonusCoins',
        value: 300,
        description: 'Bonus for user joining via referral'
      });
      await newConfig.save();
      settings.push(newConfig);
    }

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
});

router.post('/reward-settings', authenticateAdmin, async (req, res) => {
  try {
    const RewardConfig = require('../models/RewardConfig');
    const { key, value, description } = req.body;
    const setting = await RewardConfig.findOneAndUpdate(
      { key },
      { value, description },
      { upsert: true, new: true }
    );
    res.json({ success: true, setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating setting' });
  }
});

router.post('/users/:userId/adjust-coins', authenticateAdmin, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const transaction = await CoinService.adminAdjust(req.params.userId, amount, req.user?.id || 'admin', note);
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users/:userId/coin-transactions', authenticateAdmin, async (req, res) => {
  try {
    const CoinTransaction = require('../models/CoinTransaction');
    const transactions = await CoinTransaction.find({ userId: req.params.userId }).sort({ createdAt: -1 });    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching transactions' });
  }
});

// Export users to Excel (supports filter=all, filter=ordered, filter=not_ordered)
router.get('/export-users/excel', authenticateAdmin, async (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const User = require('../models/User');
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'useraddresses',
          let: { userIdStr: { $toString: '$_id' }, googleId: '$googleId' },
          pipeline: [{ $match: { $expr: { $or: [{ $eq: ['$user', '$$userIdStr'] }, { $eq: ['$user', '$$googleId'] }] } } }],
          as: 'addresses'
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: { userIdStr: { $toString: '$_id' }, googleId: '$googleId' },
          pipeline: [{ $match: { $expr: { $or: [{ $eq: ['$user', '$$userIdStr'] }, { $eq: ['$user', '$$googleId'] }] } } }],
          as: 'orders'
        }
      },
      { $project: { name: 1, email: 1, phone: 1, createdAt: 1, rgCoins: 1, orderCount: { $size: '$orders' }, addresses: 1 } }
    ]);

    let filteredUsers = users;
    let filename = 'RG_Basket_Users.xlsx';
    if (filter === 'ordered') {
      filteredUsers = users.filter(u => u.orderCount > 0);
      filename = 'RG_Basket_Ordered_Users.xlsx';
    } else if (filter === 'not_ordered' || filter === 'never_ordered') {
      filteredUsers = users.filter(u => !u.orderCount || u.orderCount === 0);
      filename = 'RG_Basket_Never_Ordered_Users.xlsx';
    }

    const data = filteredUsers.map(user => {
      // Get primary address or format all addresses
      const addressString = user.addresses && user.addresses.length > 0
        ? user.addresses.map(a => `${a.fullName}, ${a.street}, ${a.locality}, ${a.city}, ${a.state} - ${a.pincode}`).join(' | ')
        : 'N/A';

      return {
        'Name': user.name || 'N/A',
        'Email': user.email || 'N/A',
        'WhatsApp Primary': user.phone || 'N/A',
        'Address Phone': user.addresses?.[0]?.phoneNumber || 'N/A',
        'Alt Phone': user.addresses?.[0]?.alternatePhone || 'N/A',
        'Total Orders': user.orderCount || 0,
        'Order Status': (user.orderCount > 0 ? 'Ordered' : 'Never Ordered'),
        'RG Coins': user.rgCoins || 0,
        'Addresses': addressString,
        'Joined Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export users' });
  }
});

// Order Management
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders, total: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

router.delete('/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // 1. Revert Coins (Earned, Spent, and Referral)
    try {
      await CoinService.revertSpentCoins(order);
      await CoinService.revertEarnedCoins(order);
      await CoinService.revertReferralBonus(order._id);
    } catch (coinErr) {
      console.error('Error during coin reversal on delete:', coinErr);
    }

    // 2. Restore Stock
    try {
      for (const item of order.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        }
      }
    } catch (stockErr) {
      console.error('Error restoring stock on order delete:', stockErr);
    }

    // 3. Delete Order
    await Order.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Order deleted and coins/stock reverted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
});

router.put('/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { status } = req.body;
    const oldOrder = await Order.findById(req.params.id);
    
    if (!oldOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, deliveredAt: status === 'delivered' ? new Date() : oldOrder.deliveredAt },
      { new: true }
    ).populate('user', 'name email').populate('items.productId', 'name price');

    // Trigger rewards if status changed to delivered
    if (status === 'delivered' && oldOrder.status !== 'delivered') {
      try {
        await CoinService.awardOrderCoins(order);
      } catch (coinErr) {
        console.error('Error awarding coins via admin status update:', coinErr);
      }
    }

    res.json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating order status' });
  }
});

// Toggle user ban status
router.patch('/users/:userId/ban', authenticateAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const { isBanned, banReason } = req.body;
    const user = await User.findByIdAndUpdate(req.params.userId, { isBanned, banReason: isBanned ? (banReason || 'No reason provided') : '' }, { new: true }).select('-googleId');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user status' });
  }
});

// Change user role (admin/user) with self-demotion prevention
router.patch('/users/:userId/role', authenticateAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be "user" or "admin".' });
    }

    // Safety guard: prevent self-demotion
    const requesterId = req.admin?.id || req.user?.id;
    if (requesterId && req.params.userId === requesterId && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot demote yourself. Accidental lockout blocked.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select('-googleId');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Error updating user role' });
  }
});

// Delete user
router.delete('/users/:userId', authenticateAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// Product Management
router.get('/products', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { page = 1, limit = 50000, search = '', category = '', inStock = '', active = '' } = req.query;
    let query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { sku: { $regex: search, $options: 'i' } }];
    if (category) query.category = category;
    if (inStock !== '') query.inStock = inStock === 'true';
    if (active !== '') query.active = active === 'true';

    const products = await Product.find(query).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const total = await Product.countDocuments(query);
    res.json({ success: true, products, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

router.post('/products', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating product' });
  }
});

router.put('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const updateData = { ...req.body };

    // Auto-compute hasDayWisePricing and ensure variant stocks stay synced with product stock
    if (updateData.weights && Array.isArray(updateData.weights)) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      let hasSpecial = false;
      const targetStock = updateData.stock !== undefined ? updateData.stock : null;

      for (const w of updateData.weights) {
        if (targetStock !== null && targetStock > 0 && (!w.stock || w.stock === 0)) {
          w.stock = targetStock;
        }
        if (updateData.inStock !== undefined && w.inStock === undefined) {
          w.inStock = updateData.inStock;
        }
        if (w.dailyPrices) {
          for (const day of days) {
            const dp = w.dailyPrices[day];
            if (dp && dp.offerPrice !== undefined && dp.offerPrice !== null && dp.offerPrice > 0) {
              hasSpecial = true;
              break;
            }
          }
        }
      }
      updateData.hasDayWisePricing = hasSpecial;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating product' });
  }
});

router.delete('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete associated images from Cloudinary
    if (product.images && product.images.length > 0) {
      try {
        const { cloudinary } = require('../services/cloudinary');
        for (const imageUrl of product.images) {
          try {
            const urlParts = imageUrl.split('/');
            const filename = urlParts[urlParts.length - 1];
            const publicId = filename.split('.')[0];
            await cloudinary.uploader.destroy(`rgbasket-products/${publicId}`);
          } catch (deleteError) {
            console.error('Error deleting image from Cloudinary:', deleteError);
          }
        }
      } catch (clouderror) {
        console.error('Cloudinary service not available:', clouderror);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
});

// Bulk update products (prices, stock, etc.)
router.patch('/products/bulk-update', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { productIds, updateData } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Product IDs array is required' });
    }

    const allowedFields = ['active', 'featured', 'stock', 'lowStockThreshold', 'weights', 'category', 'inStock', 'maxOrderQuantity', 'hasDayWisePricing'];
    const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid fields for bulk update: ${invalidFields.join(', ')}` });
    }

    // Auto-compute hasDayWisePricing if weights are in updateData
    if (updateData.weights && Array.isArray(updateData.weights)) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      let hasSpecial = false;
      for (const w of updateData.weights) {
        if (w.dailyPrices) {
          for (const day of days) {
            const dp = w.dailyPrices[day];
            if (dp && dp.offerPrice !== undefined && dp.offerPrice !== null && dp.offerPrice > 0) {
              hasSpecial = true;
              break;
            }
          }
        }
        if (hasSpecial) break;
      }
      updateData.hasDayWisePricing = hasSpecial;
    }

    const result = await Product.updateMany({ _id: { $in: productIds } }, { $set: updateData });
    res.json({ success: true, message: `Successfully updated ${result.modifiedCount} products`, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error in bulk update' });
  }
});

// Get product statistics for admin dashboard
router.get('/products/stats', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] } },
          outOfStockProducts: { $sum: { $cond: [{ $eq: ['$inStock', false] }, 1, 0] } },
          lowStockProducts: {
            $sum: { $cond: [{ $and: [{ $lt: ['$stock', '$lowStockThreshold'] }, { $gt: ['$stock', 0] }] }, 1, 0] }
          },
          totalStockValue: {
            $sum: { $multiply: ['$stock', { $ifNull: [{ $arrayElemAt: ['$weights.offerPrice', 0] }, 0] }] }
          }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] } },
          inStock: { $sum: { $cond: [{ $eq: ['$inStock', true] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || { totalProducts: 0, activeProducts: 0, outOfStockProducts: 0, lowStockProducts: 0, totalStockValue: 0 },
        categories: categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching product statistics' });
  }
});

router.get('/categories', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const categories = await Product.distinct('category');
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
});

const FirebaseAdminService = require('../services/firebaseAdmin');

// Get list of users with push tokens (Subscribers)
router.get('/notifications/subscribers', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { pushToken: { $ne: '', $exists: true } },
        { 'pushTokens.0': { $exists: true } }
      ]
    }).select('name email phone photo pushToken pushTokens lastActive');

    res.json({ success: true, subscribers: users });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscribers' });
  }
});

// Broadcast Notification to all users
router.post('/notifications/broadcast', authenticateAdmin, async (req, res) => {
  try {
    const { title, body, data } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const result = await FirebaseAdminService.broadcast(title, body, data || {});
    res.json({ 
      success: true, 
      message: 'Notification broadcast started', 
      successCount: result.successCount,
      totalTokens: result.totalTokens
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notifications' });
  }
});

// Broadcast Notification to specific user
router.post('/notifications/send-to-user', authenticateAdmin, async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, message: 'UserId, title and body are required' });
    }

    const result = await FirebaseAdminService.sendToUser(userId, title, body, data || {});
    res.json({ 
      success: true, 
      message: 'Notification sent', 
      result 
    });
  } catch (error) {
    console.error('Send to user error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
});

// Upload image for notification banner
router.post('/notifications/upload-image', authenticateAdmin, (req, res, next) => {
  uploadBannerImage(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Image is too large. Maximum size allowed is 10MB.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Failed to upload image' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    res.json({
      success: true,
      imageUrl: req.file.path
    });
  } catch (error) {
    console.error('Notification image upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

// ==========================================
// 🚀 AUTOMATED BATCH NOTIFICATION SCHEDULER
// ==========================================

const NotificationBatch = require('../models/NotificationBatch');
const NotificationScheduler = require('../services/NotificationScheduler');
const { defaultTemplates } = require('../services/NotificationPresets');

// 1. Get all batches
router.get('/notifications/batches', authenticateAdmin, async (req, res) => {
  try {
    const batches = await NotificationBatch.find().sort({ createdAt: -1 });
    const now = new Date();
    
    // Add computed countdown and summary to each batch
    const sanitized = batches.map(batch => {
      const b = batch.toObject();
      let secondsUntilNextRun = null;
      if (b.isActive && b.nextRunAt) {
        secondsUntilNextRun = Math.max(0, Math.floor((new Date(b.nextRunAt) - now) / 1000));
      }
      return {
        ...b,
        secondsUntilNextRun,
        itemCount: b.items ? b.items.length : 0
      };
    });

    res.json({ success: true, batches: sanitized });
  } catch (error) {
    console.error('Error fetching notification batches:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notification batches' });
  }
});

// 2. Get available preset templates
router.get('/notifications/batches/templates', authenticateAdmin, (req, res) => {
  res.json({ success: true, templates: defaultTemplates });
});

// 3. Create batch from preset template
router.post('/notifications/batches/create-from-template', authenticateAdmin, async (req, res) => {
  try {
    const { templateKey } = req.body;
    const template = defaultTemplates.find(t => t.key === templateKey);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const newBatch = new NotificationBatch({
      name: template.name,
      description: template.description,
      intervalMinutes: template.intervalMinutes || 60,
      orderMode: template.orderMode || 'sequential',
      repeatMode: template.repeatMode !== undefined ? template.repeatMode : true,
      quietHours: template.quietHours || { enabled: true, startHour: 22, endHour: 7 },
      items: template.items.map(item => ({
        ...item,
        id: new mongoose.Types.ObjectId().toString(),
        sentCount: 0,
        lastSentAt: null
      })),
      isActive: false,
      status: 'draft'
    });

    await newBatch.save();
    res.status(201).json({ success: true, message: 'Batch created from template', batch: newBatch });
  } catch (error) {
    console.error('Error creating batch from template:', error);
    res.status(500).json({ success: false, message: 'Failed to create batch from template' });
  }
});

// 4. Create custom batch
router.post('/notifications/batches', authenticateAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      items,
      intervalMinutes,
      orderMode,
      repeatMode,
      quietHours,
      startMode,
      scheduledStartTime
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Batch campaign name is required' });
    }

    const sanitizedItems = (items || []).map(item => ({
      id: item.id || new mongoose.Types.ObjectId().toString(),
      title: item.title?.trim() || '',
      body: item.body?.trim() || '',
      imageUrl: item.imageUrl || '',
      targetPath: item.targetPath || '/',
      tag: item.tag || 'General',
      sentCount: 0,
      lastSentAt: null
    })).filter(i => i.title && i.body);

    const newBatch = new NotificationBatch({
      name: name.trim(),
      description: description || '',
      items: sanitizedItems,
      intervalMinutes: Math.max(1, parseInt(intervalMinutes) || 60),
      orderMode: ['sequential', 'random'].includes(orderMode) ? orderMode : 'sequential',
      repeatMode: repeatMode !== undefined ? repeatMode : true,
      quietHours: quietHours || { enabled: true, startHour: 22, endHour: 7 },
      startMode: ['immediate', 'interval', 'scheduled'].includes(startMode) ? startMode : 'immediate',
      scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : null,
      isActive: false,
      status: 'draft'
    });

    await newBatch.save();
    res.status(201).json({ success: true, message: 'Batch campaign created successfully', batch: newBatch });
  } catch (error) {
    console.error('Error creating notification batch:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification batch' });
  }
});

// 5. Get single batch details with full logs
router.get('/notifications/batches/:id', authenticateAdmin, async (req, res) => {
  try {
    const batch = await NotificationBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, batch });
  } catch (error) {
    console.error('Error fetching batch details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch batch details' });
  }
});

// 6. Update batch
router.put('/notifications/batches/:id', authenticateAdmin, async (req, res) => {
  try {
    const batch = await NotificationBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const {
      name,
      description,
      items,
      intervalMinutes,
      orderMode,
      repeatMode,
      quietHours,
      startMode,
      scheduledStartTime
    } = req.body;

    if (name) batch.name = name.trim();
    if (description !== undefined) batch.description = description;
    if (intervalMinutes) {
      batch.intervalMinutes = Math.max(1, parseInt(intervalMinutes));
      if (batch.isActive && batch.status === 'running') {
        batch.nextRunAt = new Date(Date.now() + batch.intervalMinutes * 60 * 1000);
      }
    }
    if (orderMode) batch.orderMode = orderMode;
    if (repeatMode !== undefined) batch.repeatMode = repeatMode;
    if (quietHours) batch.quietHours = quietHours;
    if (startMode) batch.startMode = startMode;
    if (scheduledStartTime !== undefined) {
      batch.scheduledStartTime = scheduledStartTime ? new Date(scheduledStartTime) : null;
      if (batch.status === 'scheduled') {
        batch.nextRunAt = batch.scheduledStartTime;
      }
    }

    if (Array.isArray(items)) {
      batch.items = items.map(item => ({
        id: item.id || new mongoose.Types.ObjectId().toString(),
        title: item.title?.trim() || '',
        body: item.body?.trim() || '',
        imageUrl: item.imageUrl || '',
        targetPath: item.targetPath || '/',
        tag: item.tag || 'General',
        sentCount: item.sentCount || 0,
        lastSentAt: item.lastSentAt || null
      })).filter(i => i.title && i.body);
    }

    await batch.save();
    res.json({ success: true, message: 'Batch updated successfully', batch });
  } catch (error) {
    console.error('Error updating notification batch:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification batch' });
  }
});

// 7. Toggle / Start batch (Immediate or Scheduled)
router.patch('/notifications/batches/:id/toggle', authenticateAdmin, async (req, res) => {
  try {
    const batch = await NotificationBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    if (!batch.items || batch.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot start an empty batch. Add at least 1 notification first.' });
    }

    const { startMode, scheduledStartTime } = req.body || {};

    // If currently active and no explicit startMode is sent, toggle to paused
    if (batch.isActive && !startMode) {
      batch.isActive = false;
      batch.status = 'paused';
      batch.nextRunAt = null;
      await batch.save();
      return res.json({
        success: true,
        message: 'Campaign paused.',
        isActive: false,
        status: 'paused',
        nextRunAt: null
      });
    }

    // Activating or starting
    const mode = startMode || batch.startMode || 'immediate';

    if (mode === 'immediate') {
      batch.isActive = true;
      batch.status = 'running';
      batch.startMode = 'immediate';
      // Dispatch first notification right now!
      const fireResult = await NotificationScheduler.dispatchBatchNotification(batch, true);
      return res.json({
        success: true,
        message: `Campaign started! 1st notification "${fireResult.itemTitle}" dispatched immediately!`,
        isActive: true,
        status: 'running',
        nextRunAt: batch.nextRunAt,
        fireResult
      });
    } else if (mode === 'scheduled') {
      const targetTime = scheduledStartTime ? new Date(scheduledStartTime) : (batch.scheduledStartTime ? new Date(batch.scheduledStartTime) : null);
      if (!targetTime || isNaN(targetTime.getTime()) || targetTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid upcoming date and time in the future to schedule this batch.'
        });
      }
      batch.isActive = true;
      batch.status = 'scheduled';
      batch.startMode = 'scheduled';
      batch.scheduledStartTime = targetTime;
      batch.nextRunAt = targetTime;
      await batch.save();
      return res.json({
        success: true,
        message: `Campaign scheduled! Will start automatically on ${targetTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`,
        isActive: true,
        status: 'scheduled',
        nextRunAt: batch.nextRunAt
      });
    } else {
      // mode === 'interval' (first send after 1 full interval)
      batch.isActive = true;
      batch.status = 'running';
      batch.startMode = 'interval';
      batch.nextRunAt = new Date(Date.now() + (batch.intervalMinutes || 60) * 60 * 1000);
      await batch.save();
      return res.json({
        success: true,
        message: `Campaign activated! First notification scheduled in ${batch.intervalMinutes} minutes.`,
        isActive: true,
        status: 'running',
        nextRunAt: batch.nextRunAt
      });
    }
  } catch (error) {
    console.error('Error toggling/starting batch status:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to toggle batch status' });
  }
});

// 8. Trigger Next Notification Immediately (Manual Fire)
router.post('/notifications/batches/:id/fire-now', authenticateAdmin, async (req, res) => {
  try {
    const result = await NotificationScheduler.triggerBatchNow(req.params.id);
    res.json({
      success: true,
      message: `Notification "${result.itemTitle}" dispatched to ${result.devicesReached} devices!`,
      result
    });
  } catch (error) {
    console.error('Error triggering batch notification now:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to dispatch notification' });
  }
});

// 9. Reset batch sequence and counters
router.post('/notifications/batches/:id/reset', authenticateAdmin, async (req, res) => {
  try {
    const batch = await NotificationBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    batch.currentIndex = 0;
    if (batch.items) {
      batch.items.forEach(i => {
        i.sentCount = 0;
        i.lastSentAt = null;
      });
    }
    if (batch.isActive) {
      batch.status = 'running';
      batch.nextRunAt = new Date(Date.now() + (batch.intervalMinutes || 60) * 60 * 1000);
    } else {
      batch.status = 'draft';
      batch.nextRunAt = null;
    }

    await batch.save();
    res.json({ success: true, message: 'Batch sequence and counters reset to beginning.', batch });
  } catch (error) {
    console.error('Error resetting batch:', error);
    res.status(500).json({ success: false, message: 'Failed to reset batch' });
  }
});

// 10. Delete batch
router.delete('/notifications/batches/:id', authenticateAdmin, async (req, res) => {
  try {
    const batch = await NotificationBatch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, message: 'Batch campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ success: false, message: 'Failed to delete batch' });
  }
});

module.exports = router;