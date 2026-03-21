const express = require('express');
const router = express.Router();
const UserAddress = require('../models/UserAddress');
const User = require('../models/User');
const Order = require('../models/Order');
const { cache } = require("../services/redis");
const { authenticateAdmin, checkBanned } = require('../middleware/auth');

// Admin: Capture/Save User Location
router.post('/admin/capture', authenticateAdmin, async (req, res) => {
  try {
    const { userId, coordinates, addressText, adminNote, orderId } = req.body;

    if (!userId || !coordinates || !coordinates.lat || !coordinates.lng) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Fetch user to get details for the dummy address
    let user = null;
    try {
      if (userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(userId);
      } else if (userId) {
        user = await User.findOne({ googleId: userId });
      }
    } catch (e) {
      console.warn('User lookup failed during location capture:', e.message);
    }

    const phoneNumber = (user && user.phone) ? user.phone : '9999999999';
    // Ensure phone matches format if user's phone is invalid/missing
    const validPhoneNumber = phoneNumber.match(/^\d{10}$/) ? phoneNumber : '9999999999';

    // Create new address with captured location
    const newAddress = new UserAddress({
      user: userId,
      fullName: (user && user.name) ? user.name : 'Valued Customer',
      phoneNumber: validPhoneNumber,
      street: addressText || `Saved Location (Order #${orderId ? orderId.slice(-6) : 'N/A'})`,
      locality: 'Admin Captured',
      city: 'Saved Location',
      state: 'Saved Location',
      pincode: '000000', // Placeholder
      location: {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat],
        capturedAt: new Date()
      },
      savedByAdmin: true,
      adminNote: adminNote || `Captured from Order #${orderId || 'N/A'}`,
      isDefault: true // Auto-select this address for next order
    });

    await newAddress.save();

    // If capture is tied to a specific order, update that order's location too
    if (orderId) {
      const locData = {
        coordinates: {
          latitude: coordinates.lat,
          longitude: coordinates.lng
        },
        timestamp: new Date(),
        accuracy: coordinates.accuracy || 0,
        source: 'admin'
      };

      await Order.findByIdAndUpdate(orderId, {
        deliveryLocation: locData
      });
      console.log(`✅ Updated deliveryLocation for Order: ${orderId}`);
    }

    res.json({
      success: true,
      message: 'Location captured and saved successfully',
      address: newAddress
    });

  } catch (error) {
    console.error('Error capturing location:', error);
    res.status(500).json({
      success: false,
      message: 'Error capturing location: ' + error.message
    });
  }
});

// Get all addresses for a user

router.get('/user/:userId', checkBanned, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Fetching addresses for user:', userId);

    // 1. Find the user first to get both their MongoDB _id and googleId
    // This handles cases where some addresses belong to googleId while others belong to _id
    const user = await User.findOne({
      $or: [
        { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null },
        { googleId: userId }
      ].filter(q => (q._id !== null && q._id !== undefined) || q.googleId !== undefined)
    });

    // 2. Build a list of all potential IDs associated with this user
    const userIds = [userId];
    if (user) {
      if (user._id) userIds.push(user._id.toString());
      if (user.googleId) userIds.push(user.googleId);
    }

    // 3. Find addresses assigned to any of these IDs (deduplicated)
    const uniqueUserIds = [...new Set(userIds.filter(id => id))];
    const addresses = await UserAddress.find({ user: { $in: uniqueUserIds } })
      .sort({ isDefault: -1, createdAt: -1 });

    console.log(`📦 Found ${addresses.length} addresses for user ${userId} (checked ${uniqueUserIds.length} ID variants)`);

    res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching addresses: ' + error.message
    });
  }
});

// Create new address
// Create new address
router.post('/', checkBanned, async (req, res) => {
  try {
    console.log('📝 Creating new address request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID from request:', req.body.user);

    // Validate required fields
    if (!req.body.user) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const address = new UserAddress(req.body);
    console.log('Address object created:', address);

    const savedAddress = await address.save();
    console.log('✅ Address saved successfully:', savedAddress._id);

    res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      address: savedAddress
    });

  } catch (error) {
    console.error('💥 Error creating address:', error);
    console.error('Error details:', error.message);
    console.error('Validation errors:', error.errors);

    res.status(500).json({
      success: false,
      message: 'Error creating address: ' + error.message
    });
  }
});
// Update address
router.put('/:id', async (req, res) => {
  try {
    const address = await UserAddress.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    Object.assign(address, req.body);
    await address.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating address'
    });
  }
});

// Delete address (for admin/user)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const address = await UserAddress.findByIdAndDelete(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting address'
    });
  }
});

// Set default address
router.patch('/:id/set-default', checkBanned, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find User IDs to handle both _id and googleId
    const user = await User.findOne({
      $or: [
        { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null },
        { googleId: userId }
      ].filter(q => (q._id !== null && q._id !== undefined) || q.googleId !== undefined)
    });

    const userIds = [userId];
    if (user) {
      if (user._id) userIds.push(user._id.toString());
      if (user.googleId) userIds.push(user.googleId);
    }
    const uniqueUserIds = [...new Set(userIds.filter(id => id))];

    // Reset default for all address variations of this user
    await UserAddress.updateMany(
      { user: { $in: uniqueUserIds } },
      { $set: { isDefault: false } }
    );

    const address = await UserAddress.findByIdAndUpdate(
      req.params.id,
      { isDefault: true },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Default address updated',
      address
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default address'
    });
  }
});

module.exports = router;