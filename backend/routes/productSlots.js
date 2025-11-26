const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const SlotConfig = require('../models/SlotConfig');
const Order = require('../models/Order');

// GET product-specific slot availability
router.get('/:id/slot-availability', async (req, res) => {
    try {
        const { date } = req.query; // YYYY-MM-DD

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date parameter is required'
            });
        }

        // Get the product
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // If product doesn't require slot selection, return empty array
        if (!product.requiresSlotSelection) {
            return res.json([]);
        }

        // Check if date is in blackout dates
        const isBlackoutDate = product.blackoutDates &&
            product.blackoutDates.includes(date);

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const now = new Date();

        // Get all active slots
        const slots = await SlotConfig.find({ isActive: true }).sort({ startTime: 1 });

        const availability = await Promise.all(slots.map(async (slot) => {
            let isAvailable = true;
            let reason = 'Available';

            // 1. Check if date is blackout date
            if (isBlackoutDate) {
                return {
                    _id: slot._id,
                    name: slot.name,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    capacity: slot.capacity,
                    booked: 0,
                    isAvailable: false,
                    reason: 'Product unavailable on this date'
                };
            }

            // 2. PERMANENT cutoff time check for today AND past dates
            const isToday = selectedDate.getTime() === today.getTime();
            const isPastDate = selectedDate < today;

            if (isToday || isPastDate) {
                const [hours, minutes] = slot.startTime.split(':').map(Number);
                const slotDateTime = new Date(selectedDate);
                slotDateTime.setHours(hours, minutes, 0, 0);

                const cutoffTime = new Date(slotDateTime.getTime() - (slot.cutoffHours * 60 * 60 * 1000));

                if (now > cutoffTime) {
                    return {
                        _id: slot._id,
                        name: slot.name,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        capacity: slot.capacity,
                        booked: 0,
                        isAvailable: false,
                        reason: `Booking closed - cutoff time passed (${slot.cutoffHours} hour before delivery)`
                    };
                }
            }

            // 3. Filter by availableSlots if specified
            if (product.availableSlots && product.availableSlots.length > 0) {
                if (!product.availableSlots.includes(slot.name)) {
                    return {
                        _id: slot._id,
                        name: slot.name,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        capacity: slot.capacity,
                        booked: 0,
                        isAvailable: false,
                        reason: 'Not available for this product'
                    };
                }
            }

            // 4. Check date-specific slot restrictions
            if (product.slotRestrictions && product.slotRestrictions.length > 0) {
                const restriction = product.slotRestrictions.find(
                    r => r.date === date && r.slots && r.slots.includes(slot.name)
                );
                if (restriction) {
                    return {
                        _id: slot._id,
                        name: slot.name,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        capacity: slot.capacity,
                        booked: 0,
                        isAvailable: false,
                        reason: restriction.reason || 'Unavailable'
                    };
                }
            }

            // 5. Count existing orders for this slot and date
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const orderCount = await Order.countDocuments({
                deliveryDate: { $gte: startOfDay, $lte: endOfDay },
                timeSlot: slot.name
            });

            if (orderCount >= slot.capacity) {
                isAvailable = false;
                reason = 'Slot full';
            }

            return {
                _id: slot._id,
                name: slot.name,
                startTime: slot.startTime,
                endTime: slot.endTime,
                capacity: slot.capacity,
                booked: orderCount,
                isAvailable,
                reason: isAvailable ? 'Available' : reason
            };
        }));

        res.json(availability);
    } catch (error) {
        console.error('Error checking product slot availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking slot availability'
        });
    }
});

module.exports = router;