const express = require('express');
const router = express.Router();
const ServiceArea = require('../models/ServiceArea');
const { authenticateAdmin } = require('../middleware/auth');

// GET all service areas (Public)
router.get('/', async (req, res) => {
    try {
        const serviceAreas = await ServiceArea.find({ isActive: true }).sort({ pincode: 1 });
        res.json({
            success: true,
            serviceAreas
        });
    } catch (error) {
        console.error('Error fetching service areas:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching service areas'
        });
    }
});

// GET all service areas (Admin - includes inactive)
router.get('/admin/all', authenticateAdmin, async (req, res) => {
    try {
        const serviceAreas = await ServiceArea.find().sort({ pincode: 1 });
        res.json({
            success: true,
            serviceAreas
        });
    } catch (error) {
        console.error('Error fetching admin service areas:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching service areas'
        });
    }
});

// POST Create new service area (Admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { pincode, name, isActive } = req.body;

        // Check if pincode already exists
        const existing = await ServiceArea.findOne({ pincode });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Pincode already exists in service areas'
            });
        }

        const newArea = new ServiceArea({ pincode, name, isActive });
        await newArea.save();

        res.status(201).json({
            success: true,
            message: 'Service area added successfully',
            serviceArea: newArea
        });
    } catch (error) {
        console.error('Error creating service area:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error creating service area'
        });
    }
});

// PUT Update service area (Admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { pincode, name, isActive } = req.body;

        const area = await ServiceArea.findByIdAndUpdate(
            req.params.id,
            { pincode, name, isActive },
            { new: true, runValidators: true }
        );

        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Service area not found'
            });
        }

        res.json({
            success: true,
            message: 'Service area updated successfully',
            serviceArea: area
        });
    } catch (error) {
        console.error('Error updating service area:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error updating service area'
        });
    }
});

// DELETE Service area (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const area = await ServiceArea.findByIdAndDelete(req.params.id);

        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Service area not found'
            });
        }

        res.json({
            success: true,
            message: 'Service area deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting service area:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting service area'
        });
    }
});

module.exports = router;
