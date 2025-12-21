const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { authenticateAdmin } = require('../middleware/auth');

// Public route for frontend to get applicable offers
router.get('/active', offerController.getActiveOffers);

// Admin routes
router.get('/', authenticateAdmin, offerController.getOffers);
router.post('/', authenticateAdmin, offerController.createOffer);
router.put('/:id', authenticateAdmin, offerController.updateOffer);
router.delete('/:id', authenticateAdmin, offerController.deleteOffer);

module.exports = router;
