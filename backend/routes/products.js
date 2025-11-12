const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { uploadProductImages } = require('../middleware/upload');
const { authenticateAdmin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { cache } = require("../services/redis");
// GET all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      inStock,
      featured,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { active: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (inStock !== undefined) {
      query.inStock = inStock === 'true';
    }
    
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    // Execute query
    const products = await Product.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.meta.views += 1;
    await product.save();

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

// GET products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const products = await Product.find({ 
      category: { $regex: new RegExp(category, 'i') },
      active: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Product.countDocuments({ 
      category: { $regex: new RegExp(category, 'i') },
      active: true 
    });

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
    console.error('Error fetching category products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category products'
    });
  }
});

// ADMIN ROUTES

// CREATE product (Admin only)
router.post('/', authenticateAdmin, uploadProductImages, async (req, res) => {
  try {
    const productData = req.body;
    
    // Parse weights if sent as string
    if (typeof productData.weights === 'string') {
      productData.weights = JSON.parse(productData.weights);
    }

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => 
        `/uploads/${file.filename}`
      );
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Clean up uploaded files if error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Error creating product'
    });
  }
});

// UPDATE product (Admin only)
router.put('/:id', authenticateAdmin, uploadProductImages, async (req, res) => {
  try {
    const productData = req.body;
    
    // Parse weights if sent as string
    if (typeof productData.weights === 'string') {
      productData.weights = JSON.parse(productData.weights);
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => 
        `/uploads/${file.filename}`
      );
      
      // Delete old images if new ones are uploaded
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.images) {
        oldProduct.images.forEach(image => {
          const imagePath = path.join(__dirname, '..', image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Clean up uploaded files if error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Error updating product'
    });
  }
});

// DELETE product (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated images
    if (product.images) {
      product.images.forEach(image => {
        const imagePath = path.join(__dirname, '..', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
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

// BULK operations (Admin only)
router.patch('/bulk/update', authenticateAdmin, async (req, res) => {
  try {
    const { productIds, updateData } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error in bulk update'
    });
  }
});

// GET categories list
router.get('/data/categories',cache(3600), async (req, res) => {
  try {
    const categories = await Product.distinct('category', { active: true });
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

module.exports = router;