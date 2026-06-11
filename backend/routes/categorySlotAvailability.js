const express = require('express');
const router = express.Router();
const CategorySlotAvailability = require('../models/CategorySlotAvailability');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/category-slot-availability - Get all restrictions
router.get('/', async (req, res) => {
    try {
        const restrictions = await CategorySlotAvailability.find().sort({ date: 1 });
        res.json({
            success: true,
            restrictions
        });
    } catch (error) {
        console.error('Error fetching category slot availability:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/category-slot-availability - Create or update restrictions (bulk categories support)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { categories, date, unavailableSlots, reason } = req.body;

        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ success: false, message: 'categories array is required' });
        }
        if (!date) {
            return res.status(400).json({ success: false, message: 'date is required' });
        }

        const operations = categories.map(cat => ({
            updateOne: {
                filter: { category: cat, date: date },
                update: {
                    $set: {
                        unavailableSlots: unavailableSlots || [],
                        reason: reason || 'Unavailable',
                        isActive: true
                    }
                },
                upsert: true
            }
        }));

        const result = await CategorySlotAvailability.bulkWrite(operations);

        res.status(201).json({
            success: true,
            message: 'Category slot restrictions updated successfully',
            result
        });
    } catch (error) {
        console.error('Error saving category slot restrictions:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// PUT /api/category-slot-availability/:id - Update restriction
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { unavailableSlots, reason, isActive } = req.body;
        const restriction = await CategorySlotAvailability.findByIdAndUpdate(
            req.params.id,
            { unavailableSlots, reason, isActive },
            { new: true }
        );

        if (!restriction) {
            return res.status(404).json({ success: false, message: 'Restriction not found' });
        }

        res.json({
            success: true,
            message: 'Restriction updated successfully',
            restriction
        });
    } catch (error) {
        console.error('Error updating category restriction:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/category-slot-availability/:id - Delete restriction
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const restriction = await CategorySlotAvailability.findByIdAndDelete(req.params.id);
        if (!restriction) {
            return res.status(404).json({ success: false, message: 'Restriction not found' });
        }
        res.json({
            success: true,
            message: 'Restriction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category restriction:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
