const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authenticateAdmin } = require('../middleware/auth');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ active: true })
      .sort({ name: 1 });
    
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

// Create new category
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, image } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const category = new Category({
      name: name.trim(),
      description,
      image
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating category'
    });
  }
});

// Update category
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, image, active } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, image, active },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category'
    });
  }
});

// Delete category (soft delete)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    // Check if category has products
    const productCount = await Product.countDocuments({ 
      category: req.params.id 
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products'
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
});

// Get categories with product counts
router.get('/with-counts', async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'name',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          image: 1,
          active: 1,
          productCount: { $size: '$products' }
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories with counts'
    });
  }
});

module.exports = router;