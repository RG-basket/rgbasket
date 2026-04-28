const express = require('express');
const router = express.Router();
const RewardConfig = require('../models/RewardConfig');

// Public route to fetch reward settings for the frontend
router.get('/', async (req, res) => {
  try {
    const settings = await RewardConfig.find();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reward settings' });
  }
});

module.exports = router;
