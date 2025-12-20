const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: [true, 'Banner image URL is required'],
    },
    altText: {
        type: String,
        default: 'RG Basket Banner',
    },
    linkUrl: {
        type: String,
        default: '',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    },
    duration: {
        type: Number,
        default: 5000, // 5 seconds
    },
    title: {
        type: String,
        default: '',
    },
    subtitle: {
        type: String,
        default: '',
    },
    ctaText: {
        type: String,
        default: 'Shop Now',
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
