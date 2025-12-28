const express = require('express');
const router = express.Router();
const ProductSlotAvailability = require('../models/ProductSlotAvailability');
const Product = require('../models/Product');
const { authenticateAdmin } = require('../middleware/auth');

// GET all product slot availability restrictions
router.get('/', async (req, res) => {
    try {
        const restrictions = await ProductSlotAvailability.find()
            .populate('productId', 'name category images')
            .sort({ dayOfWeek: 1 });

        res.json({
            success: true,
            restrictions
        });
    } catch (error) {
        console.error('Error fetching product slot availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product slot availability'
        });
    }
});

// GET restrictions for a specific product
router.get('/product/:productId', async (req, res) => {
    try {
        const restrictions = await ProductSlotAvailability.find({
            productId: req.params.productId,
            isActive: true
        }).sort({ dayOfWeek: 1 });

        res.json({
            success: true,
            restrictions
        });
    } catch (error) {
        console.error('Error fetching product restrictions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product restrictions'
        });
    }
});

// GET availability status for a product on a specific day
router.get('/check/:productId/:dayOfWeek', async (req, res) => {
    try {
        const { productId, dayOfWeek } = req.params;

        const restriction = await ProductSlotAvailability.findOne({
            productId,
            dayOfWeek,
            isActive: true
        });

        if (!restriction || restriction.unavailableSlots.length === 0) {
            return res.json({
                success: true,
                available: true,
                unavailableSlots: []
            });
        }

        res.json({
            success: true,
            available: false,
            unavailableSlots: restriction.unavailableSlots,
            reason: restriction.reason
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking availability'
        });
    }
});

// POST - Create or update product slot restriction (Admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { productId, dayOfWeek, unavailableSlots, reason } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if restriction already exists
        let restriction = await ProductSlotAvailability.findOne({
            productId,
            dayOfWeek
        });

        if (restriction) {
            // Update existing restriction
            restriction.unavailableSlots = unavailableSlots;
            restriction.reason = reason || restriction.reason;
            restriction.isActive = true;
            await restriction.save();
        } else {
            // Create new restriction
            restriction = new ProductSlotAvailability({
                productId,
                dayOfWeek,
                unavailableSlots,
                reason: reason || 'Unavailable'
            });
            await restriction.save();
        }

        res.status(201).json({
            success: true,
            message: 'Product slot restriction saved successfully',
            restriction
        });
    } catch (error) {
        console.error('Error creating product slot restriction:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error creating product slot restriction'
        });
    }
});

// PUT - Update product slot restriction (Admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { unavailableSlots, reason, isActive } = req.body;

        const restriction = await ProductSlotAvailability.findByIdAndUpdate(
            req.params.id,
            { unavailableSlots, reason, isActive },
            { new: true, runValidators: true }
        );

        if (!restriction) {
            return res.status(404).json({
                success: false,
                message: 'Restriction not found'
            });
        }

        res.json({
            success: true,
            message: 'Restriction updated successfully',
            restriction
        });
    } catch (error) {
        console.error('Error updating restriction:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error updating restriction'
        });
    }
});

// DELETE - Remove product slot restriction (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const restriction = await ProductSlotAvailability.findByIdAndDelete(req.params.id);

        if (!restriction) {
            return res.status(404).json({
                success: false,
                message: 'Restriction not found'
            });
        }

        res.json({
            success: true,
            message: 'Restriction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting restriction:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting restriction'
        });
    }
});

// BULK - Set restrictions for a product across multiple days (Admin only)
router.post('/bulk', authenticateAdmin, async (req, res) => {
    try {
        const { productId, restrictions } = req.body;
        // restrictions: [{ dayOfWeek, unavailableSlots, reason }]

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const operations = restrictions.map(r => ({
            updateOne: {
                filter: { productId, dayOfWeek: r.dayOfWeek },
                update: {
                    $set: {
                        unavailableSlots: r.unavailableSlots,
                        reason: r.reason || 'Unavailable',
                        isActive: true
                    }
                },
                upsert: true
            }
        }));

        const result = await ProductSlotAvailability.bulkWrite(operations);

        res.json({
            success: true,
            message: 'Bulk restrictions updated successfully',
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount
        });
    } catch (error) {
        console.error('Error in bulk update:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error in bulk update'
        });
    }
});

// Find common available slots for a list of products
router.post('/find-common-slots', async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product IDs provided'
            });
        }

        // Standard slots and days
        const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const allSlots = ['Morning - First Half', 'Morning - Second Half', 'Noon', 'Night - First Half', 'Night - Second Half'];

        // Initialize availability map (assume all slots available initially)
        const availability = {};
        allDays.forEach(day => {
            availability[day] = [...allSlots];
        });

        // Fetch restrictions for these products
        const restrictions = await ProductSlotAvailability.find({
            productId: { $in: productIds },
            isActive: true
        });

        // Apply restrictions
        restrictions.forEach(restriction => {
            const day = restriction.dayOfWeek;
            if (availability[day]) {
                // Remove unavailable slots from the available list for this day
                availability[day] = availability[day].filter(
                    slot => !restriction.unavailableSlots.includes(slot)
                );
            }
        });

        res.json({
            success: true,
            availability
        });

    } catch (error) {
        console.error('Error finding common slots:', error);
        res.status(500).json({
            success: false,
            message: 'Error finding common slots'
        });
    }
});

module.exports = router;
