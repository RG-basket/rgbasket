const Offer = require('../models/Offer');

exports.createOffer = async (req, res) => {
    try {
        const { minOrderValue, options, isActive } = req.body;
        const offer = new Offer({ minOrderValue, options, isActive });
        await offer.save();
        res.status(201).json({ success: true, offer });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getOffers = async (req, res) => {
    try {
        const offers = await Offer.find().sort({ minOrderValue: 1 });
        res.json({ success: true, offers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateOffer = async (req, res) => {
    try {
        const { minOrderValue, options, isActive } = req.body;
        const offer = await Offer.findByIdAndUpdate(
            req.params.id,
            { minOrderValue, options, isActive },
            { new: true }
        );
        if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
        res.json({ success: true, offer });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);
        if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
        res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getActiveOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ isActive: true }).sort({ minOrderValue: -1 });
        res.json({ success: true, offers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
