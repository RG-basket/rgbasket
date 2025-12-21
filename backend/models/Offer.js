const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    minOrderValue: {
        type: Number,
        required: true,
        unique: true
    },
    options: [{
        type: String,
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Offer', offerSchema);
