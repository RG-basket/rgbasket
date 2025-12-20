const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { uploadBannerImage, uploadMultipleBanners } = require('../middleware/upload');
const { authenticateAdmin } = require('../middleware/auth');

// Public routes
router.get('/', bannerController.getBanners);

// Admin routes
router.get('/admin/all', authenticateAdmin, bannerController.getAllBannersAdmin);
router.post('/', authenticateAdmin, uploadBannerImage, bannerController.createBanner);
router.post('/batch', authenticateAdmin, uploadMultipleBanners, bannerController.createMultipleBanners);
router.put('/:id', authenticateAdmin, uploadBannerImage, bannerController.updateBanner);
router.delete('/:id', authenticateAdmin, bannerController.deleteBanner);
router.patch('/reorder', authenticateAdmin, bannerController.reorderBanners);

module.exports = router;
