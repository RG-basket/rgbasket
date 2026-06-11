const mongoose = require('mongoose');

const categorySlotAvailabilitySchema = new mongoose.Schema({
    category: {
        type: String, // Category name (e.g. 'Mutton', 'Vegetables') or 'All'
        required: true
    },
    date: {
        type: String, // Format 'YYYY-MM-DD'
        required: true
    },
    unavailableSlots: [{
        type: String // Slot names (e.g. 'Morning - First Half', 'Noon')
    }],
    reason: {
        type: String,
        default: 'Unavailable'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Prevent duplicate restrictions for the same category on the same date
categorySlotAvailabilitySchema.index({ category: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CategorySlotAvailability', categorySlotAvailabilitySchema);
