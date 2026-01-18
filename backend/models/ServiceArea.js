const mongoose = require('mongoose');

const serviceAreaSchema = new mongoose.Schema({
    pincode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ServiceArea', serviceAreaSchema);
