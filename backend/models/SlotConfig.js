const mongoose = require('mongoose');

const slotConfigSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true // e.g., "Morning", "Afternoon"
    },
    startTime: {
        type: String, // HH:MM format, e.g., "07:00"
        required: true
    },
    endTime: {
        type: String, // HH:MM format, e.g., "10:00"
        required: true
    },
    capacity: {
        type: Number,
        default: 20,
        required: true
    },
    cutoffHours: {
        type: Number,
        default: 1, // Hours before start time to stop accepting orders
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SlotConfig', slotConfigSchema);
