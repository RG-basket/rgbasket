const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { uploadComplaintPhotos } = require('../middleware/complaintUpload');
const { authenticateAdmin } = require('../middleware/auth');

// User routes
// POST /api/complaints - Submit a new complaint
router.post('/', uploadComplaintPhotos, complaintController.createComplaint);

// GET /api/complaints/user/:userId - Get complaints for a specific user
router.get('/user/:userId', complaintController.getUserComplaints);

// Admin routes
// GET /api/complaints/admin/all - Get all complaints (Admin)
router.get('/admin/all', authenticateAdmin, complaintController.getAllComplaints);

// PUT /api/complaints/admin/:id - Update complaint status/notes (Admin)
router.put('/admin/:id', authenticateAdmin, complaintController.updateComplaintStatus);

// DELETE /api/complaints/admin/:id - Delete a resolved complaint (Admin)
router.delete('/admin/:id', authenticateAdmin, complaintController.deleteComplaint);

module.exports = router;
