const PromoCode = require('../models/PromoCode');

// Apply Promo Code
exports.applyPromoCode = async (req, res) => {
    try {
        const { code, totalAmount } = req.body;

        if (!code || !totalAmount) {
            return res.status(400).json({ success: false, message: 'Code and totalAmount are required' });
        }

        const promo = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });

        if (!promo) {
            return res.status(404).json({ success: false, message: 'Invalid or inactive promo code' });
        }

        // Check prior usage if userId is provided
        const { userId } = req.body;
        if (userId) {
            const hasUsed = promo.usedBy.some(usage => {
                const usedId = usage.user && usage.user._id ? usage.user._id.toString() : usage.user.toString();
                return usedId === userId.toString();
            });

            if (hasUsed) {
                return res.status(400).json({ success: false, message: 'You have already used this promo code' });
            }
        }

        const discountAmount = promo.calculateDiscount(totalAmount);

        res.json({
            success: true,
            data: {
                code: promo.code,
                discountAmount,
                finalTotal: totalAmount - discountAmount,
                percent: promo.percent,
                maxDiscount: promo.maxDiscountAmount
            }
        });
    } catch (error) {
        console.error('Apply promo error:', error);
        res.status(500).json({ success: false, message: 'Server error applying promo code' });
    }
};

// Validate Promo Code (Simple check)
exports.validatePromoCode = async (req, res) => {
    try {
        const { code } = req.params;
        const { userId } = req.query; // Expect userId in query for validation

        const promo = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });

        if (!promo) {
            return res.status(404).json({ success: false, message: 'Invalid promo code' });
        }

        // Check prior usage if userId is provided
        if (userId) {
            const hasUsed = promo.usedBy.some(usage => {
                const usedId = usage.user && usage.user._id ? usage.user._id.toString() : usage.user.toString();
                return usedId === userId.toString();
            });

            if (hasUsed) {
                return res.status(400).json({ success: false, message: 'You have already used this promo code' });
            }
        }

        res.json({
            success: true,
            data: {
                code: promo.code,
                percent: promo.percent,
                maxDiscount: promo.maxDiscountAmount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error validating code' });
    }
};

// Get Influencer Stats
exports.getInfluencerStats = async (req, res) => {
    try {
        const { routeName } = req.params;

        // Find promo code by influencer route
        // Note: You might want to ensure only the influencer themselves can see this, strictly 
        // but requirements say "Get influencer analytics" via route.

        const promo = await PromoCode.findOne({ influencerRoute: routeName });

        if (!promo) {
            return res.status(404).json({ success: false, message: 'Influencer route not found' });
        }

        res.json({
            success: true,
            data: {
                name: promo.name,
                code: promo.code,
                usageCount: promo.usageCount,
                earnings: promo.influencerEarnings,
                totalDiscountGiven: promo.totalDiscountGiven
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching stats' });
    }
};

// Admin: Create Promo Code
exports.createPromoCode = async (req, res) => {
    try {
        const { code, name, percent, maxDiscountAmount, influencerRoute, influencerPercentage } = req.body;

        const existing = await PromoCode.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Promo code already exists' });
        }

        if (influencerRoute) {
            const existingRoute = await PromoCode.findOne({ influencerRoute });
            if (existingRoute) {
                return res.status(400).json({ success: false, message: 'Influencer route already taken' });
            }
        }

        const newPromo = await PromoCode.create({
            code: code.toUpperCase(),
            name,
            percent,
            maxDiscountAmount,
            influencerRoute,
            influencerPercentage
        });

        res.status(201).json({
            success: true,
            message: 'Promo code created successfully',
            data: newPromo
        });
    } catch (error) {
        console.error('Create promo error:', error);
        res.status(500).json({ success: false, message: 'Error creating promo code', error: error.message });
    }
};

// Admin: Get All Promo Codes
exports.getAllPromoCodes = async (req, res) => {
    try {
        const promos = await PromoCode.find().sort('-createdAt');
        res.json({ success: true, data: promos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching promo codes' });
    }
};

// Admin: Update Status
exports.togglePromoStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const promo = await PromoCode.findById(id);

        if (!promo) {
            return res.status(404).json({ success: false, message: 'Promo code not found' });
        }

        promo.isActive = !promo.isActive;
        await promo.save();

        res.json({ success: true, message: `Promo code ${promo.isActive ? 'activated' : 'deactivated'}`, data: promo });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};

// Admin: Delete Promo Code
exports.deletePromoCode = async (req, res) => {
    try {
        const { id } = req.params;
        await PromoCode.findByIdAndDelete(id);
        res.json({ success: true, message: 'Promo code deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting promo code' });
    }
};
