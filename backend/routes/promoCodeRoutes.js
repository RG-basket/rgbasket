const express = require('express');
const router = express.Router();
const {
    applyPromoCode,
    validatePromoCode,
    getInfluencerStats,
    createPromoCode,
    getAllPromoCodes,
    togglePromoStatus,
    deletePromoCode
} = require('../controllers/promoCodeController');
const { cache } = require('../services/redis');

const { authenticateAdmin } = require('../middleware/auth');

// Public/User Routes
router.post('/apply', applyPromoCode);
router.get('/validate/:code', cache(300), validatePromoCode);
router.get('/influencer/:routeName', getInfluencerStats);

// Admin Routes (Protected)
router.post('/admin/create', authenticateAdmin, createPromoCode);
router.get('/admin/all', authenticateAdmin, getAllPromoCodes);
router.put('/admin/toggle/:id', authenticateAdmin, togglePromoStatus);
router.delete('/admin/:id', authenticateAdmin, deletePromoCode);

module.exports = router;
