const express = require('express');
const router = express.Router();
const { adminLogin, getAdminDashboard } = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');
const CoinService = require('../services/CoinService');
const User = require('../models/User'); 
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

    let baseFilter = {};
    if (search) {
      baseFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (filter === 'online') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      baseFilter.lastActive = { $gte: fiveMinutesAgo };
    } else if (filter === 'dau') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      baseFilter.lastActive = { $gte: twentyFourHoursAgo };
    } else if (filter === 'no_phone') {
      baseFilter.$or = [
        { phone: "" },
        { phone: { $exists: false } },
        { phone: null }
      ];
    } else if (filter === 'any_phone') {
      baseFilter.phone = { $ne: "", $exists: true };
    } else if (filter === 'both_email_phone') {
      baseFilter.email = { $ne: "", $exists: true };
      baseFilter.phone = { $ne: "", $exists: true };
    } else if (filter === 'only_email') {
      baseFilter.email = { $ne: "", $exists: true };
      baseFilter.$or = [
        { phone: "" },
        { phone: { $exists: false } },
        { phone: null }
      ];
    }

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
        totalAdmins: globalStats.totalAdmins
      }
    });
  } catch (error) {
    console.error('Error in /api/admin/users aggregation:', error);
    res.status(500).json({ success: false, message: 'Error fetching users and statistics' });
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

// Export all users to Excel
router.get('/export-users/excel', authenticateAdmin, async (req, res) => {
  try {
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

    const data = users.map(user => {
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
    res.setHeader('Content-Disposition', 'attachment; filename=RG_Basket_Users.xlsx');
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
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

    const allowedFields = ['active', 'featured', 'stock', 'lowStockThreshold', 'weights', 'category', 'inStock', 'maxOrderQuantity'];
    const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid fields for bulk update: ${invalidFields.join(', ')}` });
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

module.exports = router;