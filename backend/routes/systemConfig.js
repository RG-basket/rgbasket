const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');
const { authenticateAdmin } = require('../middleware/auth');

let cachedMaintenanceMode = null;

// GET /api/system-config/maintenance - Public route to fetch maintenance mode status (uses in-memory cache)
router.get('/maintenance', async (req, res) => {
    try {
        if (cachedMaintenanceMode === null) {
            const config = await SystemConfig.findOne({ key: 'maintenanceMode' });
            cachedMaintenanceMode = config ? !!config.value : false;
        }
        res.json({
            success: true,
            maintenanceMode: cachedMaintenanceMode
        });
    } catch (error) {
        console.error('Error fetching maintenance config:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/system-config/maintenance - Admin route to set maintenance mode status
router.post('/maintenance', authenticateAdmin, async (req, res) => {
    try {
        const { maintenanceMode } = req.body;
        if (typeof maintenanceMode !== 'boolean') {
            return res.status(400).json({ success: false, message: 'maintenanceMode must be a boolean' });
        }

        const config = await SystemConfig.findOneAndUpdate(
            { key: 'maintenanceMode' },
            { value: maintenanceMode },
            { upsert: true, new: true }
        );

        // Update the in-memory cache instantly
        cachedMaintenanceMode = !!config.value;

        res.json({
            success: true,
            message: `Maintenance mode turned ${maintenanceMode ? 'ON' : 'OFF'}`,
            maintenanceMode: config.value
        });
    } catch (error) {
        console.error('Error setting maintenance config:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
