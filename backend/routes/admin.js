const express = require('express');
const router = express.Router();
const { adminLogin, getAdminDashboard } = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// Public route - Admin login
router.post('/login', adminLogin);

// Protected routes - Require admin authentication
router.get('/dashboard', authenticateAdmin, getAdminDashboard);

// User Management
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const Order = require('../models/Order');
    const UserAddress = require('../models/UserAddress');

    // Fetch all users
    const users = await User.find().sort({ createdAt: -1 }).lean();

    // Fetch details for each user
    const usersWithDetails = await Promise.all(users.map(async (user) => {
      // Find addresses where user is either _id or googleId (just in case)
      const addresses = await UserAddress.find({
        $or: [
          { user: user._id.toString() },
          { user: user.googleId } // We need googleId for this, so don't select it out yet or fetch it specifically
        ]
      }).sort({ isDefault: -1 }).lean();

      // Find orders for the user
      const orders = await Order.find({
        $or: [
          { user: user._id.toString() },
          { user: user.googleId }
        ]
      }).sort({ createdAt: -1 }).lean();

      return {
        ...user,
        addresses,
        orders
      };
    }));

    res.json({
      success: true,
      users: usersWithDetails,
      total: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Toggle user active status
router.patch('/users/:userId/status', authenticateAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const { active } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { active },
      { new: true }
    ).select('-googleId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${active ? 'activated' : 'banned'} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

// Delete user
router.delete('/users/:userId', authenticateAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// Product Management

// Get all products for admin (with pagination and filters)
// Replaces the simple get all route
router.get('/products', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const {
      page = 1,
      limit = 50000,
      search = '',
      category = '',
      inStock = '',
      active = ''
    } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (inStock !== '') {
      query.inStock = inStock === 'true';
    }

    if (active !== '') {
      query.active = active === 'true';
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

router.post('/products', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating product'
    });
  }
});

router.put('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating product'
    });
  }
});

// Delete product
router.delete('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated images from Cloudinary
    if (product.images && product.images.length > 0) {
      const { cloudinary } = require('../services/cloudinary');
      for (const imageUrl of product.images) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = imageUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          const publicId = filename.split('.')[0];
          await cloudinary.uploader.destroy(`rgbasket-products/${publicId}`);
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
});

// Bulk update products (prices, stock, etc.)
router.patch('/products/bulk-update', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { productIds, updateData } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    if (!updateData || typeof updateData !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Update data is required'
      });
    }

    // Validate that only allowed fields are being updated
    const allowedFields = [
      'active', 'featured', 'stock', 'lowStockThreshold',
      'weights', 'category', 'inStock', 'maxOrderQuantity'
    ];

    const invalidFields = Object.keys(updateData).filter(
      field => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields for bulk update: ${invalidFields.join(', ')}`
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk update'
    });
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
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ['$inStock', false] }, 1, 0] }
          },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $and: [{ $lt: ['$stock', '$lowStockThreshold'] }, { $gt: ['$stock', 0] }] },
                1,
                0
              ]
            }
          },
          totalStockValue: {
            $sum: {
              $multiply: [
                '$stock',
                { $ifNull: [{ $arrayElemAt: ['$weights.offerPrice', 0] }, 0] }
              ]
            }
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
        overview: stats[0] || {
          totalProducts: 0,
          activeProducts: 0,
          outOfStockProducts: 0,
          lowStockProducts: 0,
          totalStockValue: 0
        },
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product statistics'
    });
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

    res.json({
      success: true,
      orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

router.put('/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email')
      .populate('items.productId', 'name price');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating order status'
    });
  }
});

// Categories
router.get('/categories', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const categories = await Product.distinct('category');
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

module.exports = router;