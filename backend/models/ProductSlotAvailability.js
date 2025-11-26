const mongoose = require('mongoose');

const productSlotAvailabilitySchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    unavailableSlots: [{
        type: String,
        // Slot names like 'Morning', 'Afternoon', 'Evening'
        // Must match SlotConfig.name values
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

// Prevent duplicate entries for same product-day combination
productSlotAvailabilitySchema.index({ productId: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('ProductSlotAvailability', productSlotAvailabilitySchema);
