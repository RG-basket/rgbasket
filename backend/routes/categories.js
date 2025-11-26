const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authenticateAdmin } = require('../middleware/auth');

// Get all categories with product counts
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    // Get product count for each category
    const categoriesWithCounts = await Promise.all(categories.map(async (category) => {
      const count = await Product.countDocuments({
        category: { $regex: new RegExp(`^${category.name}$`, 'i') },
        active: true
      });

      return {
        ...category.toObject(),
        productCount: count
      };
    }));

    res.json({ success: true, categories: categoriesWithCounts });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Create new category
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, emoji } = req.body;

    if (!name || !emoji) {
      return res.status(400).json({
        success: false,
        message: 'Name and emoji are required'
      });
    }

    const existingCategory = await Category.findOne({
      name: new RegExp(`^${name.trim()}$`, 'i')
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const category = new Category({
      name: name.trim(),
      emoji: emoji.trim()
    });

    await category.save();

    const categoryResponse = category.toObject();
    categoryResponse.productCount = 0;

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: categoryResponse
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
});

// Update category
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, emoji } = req.body;

    if (!name || !emoji) {
      return res.status(400).json({
        success: false,
        message: 'Name and emoji are required'
      });
    }

    const oldCategory = await Category.findById(req.params.id);
    if (!oldCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), emoji: emoji.trim() },
      { new: true, runValidators: true }
    );

    // Update all products that reference the old category name
    if (oldCategory.name !== name.trim()) {
      await Product.updateMany(
        { category: oldCategory.name },
        { category: name.trim() }
      );
      console.log(`Updated products from "${oldCategory.name}" to "${name.trim()}"`);
    }

    const productCount = await Product.countDocuments({
      category: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    const categoryResponse = category.toObject();
    categoryResponse.productCount = productCount;

    res.json({
      success: true,
      message: 'Category updated successfully',
      category: categoryResponse
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
});

// Delete category
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const productCount = await Product.countDocuments({
      category: { $regex: new RegExp(`^${category.name}$`, 'i') }
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} product(s) associated with it.`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
});

module.exports = router;