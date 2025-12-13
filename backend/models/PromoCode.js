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

promoCodeSchema.methods.updateUsage = async function (userId, orderId, discountAmount, orderTotal) {
    console.log(`[PromoCode] updateUsage called. Code: ${this.code}, Route: ${this.influencerRoute}, \%: ${this.influencerPercentage}`);
    this.usageCount += 1;
    this.totalDiscountGiven += discountAmount;

    if (this.influencerRoute && this.influencerPercentage > 0) {
        const earning = (orderTotal * this.influencerPercentage) / 100;
        this.influencerEarnings += earning;
        console.log(`[PromoCode] Influencer earning added: ${earning}. Total: ${this.influencerEarnings}`);
    }

    this.usedBy.push({
        user: userId,
        order: orderId
    });

    await this.save();
    console.log(`[PromoCode] Stats saved.`);
};

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

module.exports = PromoCode;
