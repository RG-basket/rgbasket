const express = require('express');
const router = express.Router();
const UserAddress = require('../models/UserAddress');
const User = require('../models/User');
const Order = require('../models/Order');
const { cache } = require("../services/redis");
const { authenticateAdmin, checkBanned, authenticateUser } = require('../middleware/auth');

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

router.get('/user/:userId', authenticateUser, checkBanned, async (req, res) => {
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

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ownership check: Caller must be the requested user OR an admin
    if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this account.' });
    }

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

    const normalizedAddresses = addresses.map((addr, idx) => {
      const obj = addr.toObject ? addr.toObject() : addr;
      if (!obj.addressType) {
        // Assign Home to first legacy address, Office/Other to subsequent if any
        obj.addressType = idx === 0 ? 'Home' : idx === 1 ? 'Office' : 'Other';
      }
      return obj;
    });

    res.json({
      success: true,
      addresses: normalizedAddresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching addresses: ' + error.message
    });
  }
});

// Create or update address (Up to 3 slots: Home, Office, Other)
router.post('/', authenticateUser, checkBanned, async (req, res) => {
  try {
    console.log('📝 Creating/updating address request received');
    console.log('User ID from request:', req.body.user);

    // Validate required fields
    if (!req.body.user) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Ownership check: Caller must create address for themselves or be admin
    const targetUserId = req.body.user;
    const targetUserIdStr = targetUserId ? String(targetUserId).trim() : '';
    const isTargetHex = /^[0-9a-fA-F]{24}$/.test(targetUserIdStr);
    const targetUser = await User.findOne({
      $or: [
        ...(isTargetHex ? [{ _id: targetUserIdStr }] : []),
        ...(targetUserIdStr ? [{ googleId: targetUserIdStr }] : [])
      ]
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user.id !== targetUser._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Unauthorized request.' });
    }

    // Normalize addressType
    const normalizedType = ['Home', 'Office', 'Other'].includes(req.body.addressType)
      ? req.body.addressType
      : 'Home';
    req.body.addressType = normalizedType;

    // Collect user ID variants for robust lookup
    const userIds = [targetUserId];
    if (targetUser._id) userIds.push(targetUser._id.toString());
    if (targetUser.googleId) userIds.push(targetUser.googleId);
    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

    // Check if an address with this addressType already exists for this user
    let existingAddress = await UserAddress.findOne({
      user: { $in: uniqueUserIds },
      $or: [
        { addressType: normalizedType },
        ...(normalizedType === 'Home' ? [{ addressType: { $exists: false } }, { addressType: null }] : [])
      ]
    });

    // If no exact match but user already reached 3 addresses, reuse a slot
    if (!existingAddress) {
      const existingList = await UserAddress.find({ user: { $in: uniqueUserIds } }).sort({ createdAt: 1 });
      if (existingList.length >= 3) {
        // Reuse an unassigned or duplicate slot
        const duplicateOrUnassigned = existingList.find(a => !a.addressType || a.addressType === 'Home');
        existingAddress = duplicateOrUnassigned || existingList[existingList.length - 1];
      }
    }

    let savedAddress;
    if (existingAddress) {
      // Upsert: replace details in this existing slot
      console.log(`🔄 Updating existing ${normalizedType} address (${existingAddress._id}) for user`);
      const updateData = { ...req.body, addressType: normalizedType };
      delete updateData._id;
      delete updateData.__v;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      Object.assign(existingAddress, updateData);
      
      if (req.body.isDefault) {
        await UserAddress.updateMany(
          { user: { $in: uniqueUserIds }, _id: { $ne: existingAddress._id } },
          { $set: { isDefault: false } }
        );
      }

      savedAddress = await existingAddress.save();
    } else {
      if (req.body.isDefault) {
        await UserAddress.updateMany(
          { user: { $in: uniqueUserIds } },
          { $set: { isDefault: false } }
        );
      }

      const newAddressData = { ...req.body, addressType: normalizedType };
      delete newAddressData._id;
      const address = new UserAddress(newAddressData);
      savedAddress = await address.save();
    }

    console.log('✅ Address slot saved successfully:', savedAddress._id, savedAddress.addressType);

    res.status(201).json({
      success: true,
      message: `${normalizedType} address saved successfully`,
      address: savedAddress
    });

  } catch (error) {
    console.error('💥 Error creating/updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving address: ' + error.message
    });
  }
});

// Update address
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const address = await UserAddress.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Ownership check: Caller must own the address or be admin
    const addrUserStr = address.user ? String(address.user).trim() : '';
    const isAddrHex = /^[0-9a-fA-F]{24}$/.test(addrUserStr);
    const addressUser = await User.findOne({
      $or: [
        ...(isAddrHex ? [{ _id: addrUserStr }] : []),
        ...(addrUserStr ? [{ googleId: addrUserStr }] : [])
      ]
    });

    const isOwner = address.user === req.user.id || (addressUser && addressUser._id.toString() === req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this address.' });
    }

    if (req.body.addressType && ['Home', 'Office', 'Other'].includes(req.body.addressType)) {
      address.addressType = req.body.addressType;
    }
    if (req.body.otherLabel !== undefined) {
      address.otherLabel = req.body.otherLabel;
    }

    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    Object.assign(address, updateData);

    if (req.body.isDefault) {
      const userIds = [address.user];
      if (addressUser?._id) userIds.push(addressUser._id.toString());
      if (addressUser?.googleId) userIds.push(addressUser.googleId);
      const uniqueIds = [...new Set(userIds.filter(Boolean))];
      await UserAddress.updateMany(
        { user: { $in: uniqueIds }, _id: { $ne: address._id } },
        { $set: { isDefault: false } }
      );
    }

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

// Delete address (for owner user or admin)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const address = await UserAddress.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Ownership check: Caller must own the address or be admin
    const addrUserStr = address.user ? String(address.user).trim() : '';
    const isAddrHex = /^[0-9a-fA-F]{24}$/.test(addrUserStr);
    const addressUser = await User.findOne({
      $or: [
        ...(isAddrHex ? [{ _id: addrUserStr }] : []),
        ...(addrUserStr ? [{ googleId: addrUserStr }] : [])
      ]
    });

    const isOwner = address.user === req.user.id || (addressUser && addressUser._id.toString() === req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this address.' });
    }

    await UserAddress.findByIdAndDelete(req.params.id);

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
router.patch('/:id/set-default', authenticateUser, checkBanned, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find User IDs to handle both _id and googleId
    const user = await User.findOne({
      $or: [
        { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null },
        { googleId: userId }
      ].filter(q => (q._id !== null && q._id !== undefined) || q.googleId !== undefined)
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ownership check: Caller must own this user account OR be admin
    if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this account.' });
    }

    const userIds = [userId];
    if (user) {
      if (user._id) userIds.push(user._id.toString());
      if (user.googleId) userIds.push(user.googleId);
    }
    const uniqueUserIds = [...new Set(userIds.filter(id => id))];

    // Address verification: Ensure the address being updated actually belongs to this user
    const targetAddress = await UserAddress.findById(req.params.id);
    if (!targetAddress) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    if (!uniqueUserIds.includes(targetAddress.user) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Address does not belong to you.' });
    }

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