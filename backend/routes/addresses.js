const express = require('express');
const router = express.Router();
const UserAddress = require('../models/UserAddress');
const User = require('../models/User');
const Order = require('../models/Order');
const { cache } = require("../services/redis");
const { authenticateAdmin } = require('../middleware/auth');

// Admin: Capture/Save User Location
router.post('/admin/capture', authenticateAdmin, async (req, res) => {
  try {
    const { userId, coordinates, addressText, adminNote, orderId } = req.body;

    if (!userId || !coordinates || !coordinates.lat || !coordinates.lng) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Fetch user to get details for the dummy address
    let user = null;
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ googleId: userId });
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
      await Order.findByIdAndUpdate(orderId, {
        location: {
          coordinates: {
            latitude: coordinates.lat,
            longitude: coordinates.lng
          },
          timestamp: new Date(),
          accuracy: coordinates.accuracy || 0
        }
      });
      console.log(`✅ Updated location for Order: ${orderId}`);
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

router.get('/user/:userId', async (req, res) => {
  try {
    console.log('Fetching addresses for user:', req.params.userId);

    const addresses = await UserAddress.find({ user: req.params.userId })
      .sort({ isDefault: -1, createdAt: -1 });

    console.log('Found addresses:', addresses.length);

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
router.post('/', async (req, res) => {
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

// Delete address
router.delete('/:id', async (req, res) => {
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
router.patch('/:id/set-default', async (req, res) => {
  try {
    await UserAddress.updateMany(
      { user: req.body.userId },
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