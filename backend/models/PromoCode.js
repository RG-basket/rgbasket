const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Promo code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        minlength: [5, 'Promo code must be at least 5 characters'],
        maxlength: [10, 'Promo code cannot exceed 10 characters'],
        validate: {
            validator: function (v) {
                return /^[A-Z0-9]+$/.test(v);
            },
            message: props => `${props.value} is not a valid promo code! Only alphanumeric characters allowed.`
        }
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    percent: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    maxDiscountAmount: {
        type: Number,
        default: null
    },
    influencerRoute: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
    totalDiscountGiven: {
        type: Number,
        default: 0
    },
    influencerEarnings: {
        type: Number,
        default: 0
    },
    influencerPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usedBy: [{
        user: { type: String, ref: 'User' },
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        usedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

promoCodeSchema.methods.calculateDiscount = function (totalAmount) {
    if (!this.isActive) return 0;

    let discount = (totalAmount * this.percent) / 100;

    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
        discount = this.maxDiscountAmount;
    }

    return Math.round(discount * 100) / 100;
};

// Atomic update that prevents duplicate usage in high traffic
promoCodeSchema.statics.registerUsageAtomic = async function (promoId, userId, orderId, discountAmount) {
    const result = await this.findOneAndUpdate(
        {
            _id: promoId,
            isActive: true,
            'usedBy.user': { $ne: userId } // Critical: ensures user hasn't used it yet
        },
        {
            $inc: { usageCount: 1, totalDiscountGiven: Math.round(discountAmount * 100) / 100 },
            $push: { usedBy: { user: userId, order: orderId, usedAt: new Date() } }
        },
        { new: true }
    );

    if (!result) {
        throw new Error('Promo code could not be applied. It may have been used or is inactive.');
    }
    return result;
};

// Logic to revert promo usage if order is cancelled
promoCodeSchema.statics.revertUsageAtomic = async function (promoCode, userId, orderId) {
    if (!promoCode) return;

    await this.findOneAndUpdate(
        { code: promoCode },
        {
            $inc: { usageCount: -1 }, // Decrease total count
            $pull: { usedBy: { user: userId } } // Remove usage record for this user
        }
    );
};

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

module.exports = PromoCode;
