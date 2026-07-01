const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');
const SurgeConfig = require('../models/SurgeConfig');
const { authenticateAdmin } = require('../middleware/auth');

let cachedMaintenanceMode = null;
let cachedActiveSurges = null;

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

// GET /api/system-config/surge - Public route to fetch all active surge configurations (uses cache)
router.get('/surge', async (req, res) => {
    try {
        if (cachedActiveSurges === null) {
            await updateActiveSurgeCache();
        }
        res.json({
            success: true,
            activeSurges: cachedActiveSurges || []
        });
    } catch (error) {
        console.error('Error fetching public active surges:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/system-config/surge/admin - Admin route to fetch all surge configs
router.get('/surge/admin', authenticateAdmin, async (req, res) => {
    try {
        const surges = await SurgeConfig.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            surges
        });
    } catch (error) {
        console.error('Error fetching admin surges:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/system-config/surge - Admin route to create a new surge config
router.post('/surge', authenticateAdmin, async (req, res) => {
    try {
        const { name, amount, isActive } = req.body;
        if (!name || typeof amount !== 'number' || amount < 0) {
            return res.status(400).json({ success: false, message: 'Invalid payload: name and non-negative amount are required.' });
        }

        const existing = await SurgeConfig.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'A surge config with this name already exists.' });
        }

        const surge = new SurgeConfig({
            name: name.trim(),
            amount,
            isActive: typeof isActive === 'boolean' ? isActive : false
        });

        await surge.save();
        await updateActiveSurgeCache();

        res.json({
            success: true,
            message: 'Surge configuration created successfully',
            surge
        });
    } catch (error) {
        console.error('Error creating surge config:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// PUT /api/system-config/surge/:id - Admin route to update/edit an existing surge config
router.put('/surge/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount, isActive } = req.body;

        const surge = await SurgeConfig.findById(id);
        if (!surge) {
            return res.status(404).json({ success: false, message: 'Surge configuration not found' });
        }

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ success: false, message: 'Name cannot be empty' });
            }
            const existing = await SurgeConfig.findOne({ name: name.trim(), _id: { $ne: id } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Another surge config with this name already exists.' });
            }
            surge.name = name.trim();
        }

        if (amount !== undefined) {
            if (typeof amount !== 'number' || amount < 0) {
                return res.status(400).json({ success: false, message: 'Amount must be a non-negative number' });
            }
            surge.amount = amount;
        }

        if (isActive !== undefined) {
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
            }
            surge.isActive = isActive;
        }

        await surge.save();
        await updateActiveSurgeCache();

        res.json({
            success: true,
            message: 'Surge configuration updated successfully',
            surge
        });
    } catch (error) {
        console.error('Error updating surge config:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// DELETE /api/system-config/surge/:id - Admin route to delete a surge config
router.delete('/surge/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await SurgeConfig.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Surge configuration not found' });
        }

        await updateActiveSurgeCache();

        res.json({
            success: true,
            message: 'Surge configuration deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting surge config:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Helper function to update active surge cache
const updateActiveSurgeCache = async () => {
    try {
        const activeSurges = await SurgeConfig.find({ isActive: true });
        cachedActiveSurges = activeSurges.map(s => ({
            _id: s._id,
            name: s.name,
            amount: s.amount,
            isActive: s.isActive
        }));
    } catch (error) {
        console.error('Error updating active surge cache:', error);
        cachedActiveSurges = null; // force reload next time
    }
};

module.exports = router;
