const express = require('express');
const router = express.Router();
const dpController = require('../controllers/deliveryPartnerController');
const { authenticateAdmin } = require('../middleware/auth');
const multer = require('multer');
const { riderStorage } = require('../services/cloudinary');
const upload = multer({ storage: riderStorage });

// --- ADMIN ROUTES ---
// Admin can view all, create, update, delete delivery partners. And assign order manually.
router.get('/admin', authenticateAdmin, dpController.getAllPartners);
router.post('/admin', authenticateAdmin, upload.fields([
    { name: 'aadharCard', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'vehicleRc', maxCount: 1 }
]), dpController.createPartner);
router.put('/admin/:partnerId', authenticateAdmin, dpController.updatePartner);
router.delete('/admin/:partnerId', authenticateAdmin, dpController.deletePartner);
router.post('/admin/assign-order', authenticateAdmin, dpController.assignOrder);

// --- RIDER ROUTES ---
// Login (No auth check here, since it's simple PIN base auth)
router.post('/login', dpController.riderLogin);

// Get available orders
router.get('/available-orders/:partnerId', dpController.getAvailableOrders);

// Accept an order
router.post('/accept-order', dpController.acceptOrder);

// Get my orders
router.get('/my-orders/:partnerId', dpController.getMyOrders);

// Update live location (Heartbeat)
router.post('/update-live-ping', dpController.updateLivePing);

// Complete order (Mark Delivered) with Proof
const { proofStorage } = require('../services/cloudinary');
const uploadProof = multer({ storage: proofStorage });
router.post('/complete-order', uploadProof.single('proofImage'), dpController.completeOrder);

// Update order location (Capture)
router.post('/update-location', dpController.updateOrderLocation);

// Admin: Delete proof of delivery
router.delete('/admin/orders/:orderId/proof', authenticateAdmin, dpController.deleteProof);

// Get customer location history
router.get('/customer-location-history/:userId', dpController.getCustomerLocationHistory);

// Toggle status (Active/Inactive)
router.patch('/toggle-status/:partnerId', dpController.toggleStatus);

module.exports = router;
