const express = require('express');
const router = express.Router();
const SlotConfig = require('../models/SlotConfig');
const Order = require('../models/Order');
const { authenticateAdminOr404 } = require('../middleware/auth');

/* -------------------------------
   Slot Initialization
--------------------------------- */
const initializeSlots = async () => {
  try {
    // Ensure unique index on slot name
    await SlotConfig.collection.createIndex({ name: 1 }, { unique: true });

    const defaultSlots = [
      { name: 'Morning', startTime: '07:00', endTime: '10:00', capacity: 200, cutoffHours: 1 },
      { name: 'Afternoon', startTime: '12:00', endTime: '14:00', capacity: 200, cutoffHours: 1 },
      { name: 'Evening', startTime: '17:00', endTime: '20:00', capacity: 200, cutoffHours: 1 }
    ];

    const operations = defaultSlots.map(slot => ({
      updateOne: {
        filter: { name: slot.name },
        update: { $setOnInsert: slot },
        upsert: true
      }
    }));

    await SlotConfig.bulkWrite(operations);
    console.log('✅ Slots initialized/verified');
  } catch (error) {
    if (error.code === 11000) {
      console.log('Cleaning up duplicate slots...');
      await cleanupDuplicates();
      await initializeSlots(); // Retry
    } else {
      console.error('Error initializing slots:', error);
    }
  }
};

const cleanupDuplicates = async () => {
  try {
    const slots = await SlotConfig.find().sort({ createdAt: 1 });
    const seen = new Set();

    for (const slot of slots) {
      if (seen.has(slot.name)) {
        await SlotConfig.findByIdAndDelete(slot._id);
        console.log(`Deleted duplicate: ${slot.name}`);
      } else {
        seen.add(slot.name);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Delay initialization to ensure MongoDB is ready
setTimeout(() => {
  initializeSlots();
}, 3000);

/* -------------------------------
   CRUD Routes
--------------------------------- */

// GET /api/slots - Get all slot configurations
router.get('/', async (req, res) => {
  try {
    const slots = await SlotConfig.find().sort({ startTime: 1 });
    res.json(slots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ success: false, message: 'Error fetching slots' });
  }
});

// POST /api/slots - Create new slot config (Admin)
router.post('/', authenticateAdminOr404, async (req, res) => {
  try {
    const slot = new SlotConfig(req.body);
    await slot.save();
    res.status(201).json(slot);
  } catch (error) {
    console.error('Error creating slot:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/slots/:id - Update slot config (Admin)
router.put('/:id', authenticateAdminOr404, async (req, res) => {
  try {
    const slot = await SlotConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json(slot);
  } catch (error) {
    console.error('Error updating slot:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/* -------------------------------
   Availability Route - ULTRA SIMPLE WORKING SOLUTION
--------------------------------- */

// SIMPLE: Check if cutoff has passed
const hasCutoffPassed = (slot, selectedDate, now) => {
  // Get today's date at 00:00:00
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  // Get selected date at 00:00:00
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);
  
  // Past dates: always unavailable
  if (selected < today) {
    return true;
  }
  
  // Future dates: always available (no cutoff check)
  if (selected > today) {
    return false;
  }
  
  // TODAY: Check cutoff times
  const [hours, minutes] = slot.startTime.split(':').map(Number);
  
  // Create slot time for today
  const slotTime = new Date(today);
  slotTime.setHours(hours, minutes, 0, 0);
  
  // Calculate cutoff time (1 hour before)
  const cutoffTime = new Date(slotTime.getTime() - (slot.cutoffHours * 60 * 60 * 1000));
  
  // Check if current time is past cutoff
  return now > cutoffTime;
};

// GET /api/slots/availability - SIMPLE AND WORKING
router.get('/availability', async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const now = new Date();
    const selectedDate = new Date(date + 'T00:00:00');
    
    console.log('\n=== SLOT AVAILABILITY ===');
    console.log(`Requested date: ${date}`);
    console.log(`Current server time: ${now.toString()}`);
    console.log(`Server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`Is today? ${selectedDate.toDateString() === new Date().toDateString()}`);

    const slots = await SlotConfig.find({ isActive: true }).sort({ startTime: 1 });

    const availability = await Promise.all(slots.map(async (slot) => {
      // Simple cutoff check
      const cutoffPassed = hasCutoffPassed(slot, selectedDate, now);
      
      // Count orders for the date (using local date range)
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const orderCount = await Order.countDocuments({
        deliveryDate: { $gte: startOfDay, $lte: endOfDay },
        timeSlot: slot.name
      });
      
      const isAvailable = !cutoffPassed && orderCount < slot.capacity;
      
      // Debug log
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hours, minutes, 0, 0);
      const cutoffTime = new Date(slotTime.getTime() - (slot.cutoffHours * 60 * 60 * 1000));
      
      console.log(`${slot.name}:`);
      console.log(`  Slot time: ${slotTime.toLocaleTimeString('en-IN')}`);
      console.log(`  Cutoff time: ${cutoffTime.toLocaleTimeString('en-IN')}`);
      console.log(`  Current time: ${now.toLocaleTimeString('en-IN')}`);
      console.log(`  Cutoff passed: ${cutoffPassed}`);
      console.log(`  Booked: ${orderCount}/${slot.capacity}`);
      console.log(`  Available: ${isAvailable}`);
      
      return {
        _id: slot._id,
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        booked: orderCount,
        isAvailable: isAvailable,
        reason: cutoffPassed
          ? `Booking closed - cutoff time passed (${slot.cutoffHours} hour before delivery)`
          : (orderCount >= slot.capacity ? 'Slot full' : 'Available')
      };
    }));

    console.log('================================\n');
    res.json(availability);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ success: false, message: 'Error checking availability' });
  }
});

module.exports = router;