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
      { name: 'Morning', startTime: '07:00', endTime: '10:00', capacity: 20, cutoffHours: 1 },
      { name: 'Afternoon', startTime: '12:00', endTime: '14:00', capacity: 20, cutoffHours: 1 },
      { name: 'Evening', startTime: '17:00', endTime: '20:00', capacity: 20, cutoffHours: 1 }
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

initializeSlots();

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
   Availability Route
--------------------------------- */

// Helper: Check if cutoff has passed
const hasCutoffPassed = (slot, selectedDate, now, today) => {
  const isToday = selectedDate.getTime() === today.getTime();
  const isPastDate = selectedDate < today;

  console.log(`  Slot: ${slot.name}, isToday: ${isToday}, isPastDate: ${isPastDate}`);

  // Past dates are always unavailable
  if (isPastDate) {
    console.log(`  -> Past date, unavailable`);
    return true;
  }

  // Only apply cutoff logic for today
  if (isToday) {
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(hours, minutes, 0, 0);

    const cutoffTime = new Date(slotDateTime.getTime() - (slot.cutoffHours * 60 * 60 * 1000));
    const passed = now > cutoffTime;
    console.log(`  -> Today, cutoffTime: ${cutoffTime.toISOString()}, now: ${now.toISOString()}, passed: ${passed}`);
    return passed;
  }

  // Future dates: cutoff never passed
  console.log(`  -> Future date, available`);
  return false;
};

// GET /api/slots/availability - Check availability for a specific date
router.get('/availability', async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    // Create selectedDate and normalize to midnight
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Create today and normalize to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Current time for cutoff comparison
    const now = new Date();

    // DEBUG LOGGING
    console.log('=== SLOT AVAILABILITY DEBUG ===');
    console.log('Requested date:', date);
    console.log('selectedDate:', selectedDate.toISOString());
    console.log('today:', today.toISOString());
    console.log('now:', now.toISOString());
    console.log('selectedDate === today?', selectedDate.getTime() === today.getTime());

    const slots = await SlotConfig.find({ isActive: true }).sort({ startTime: 1 });

    const availability = await Promise.all(slots.map(async (slot) => {
      const cutoffPassed = hasCutoffPassed(slot, selectedDate, now, today);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const orderCount = await Order.countDocuments({
        deliveryDate: { $gte: startOfDay, $lte: endOfDay },
        timeSlot: slot.name
      });

      return {
        _id: slot._id,
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        booked: orderCount,
        isAvailable: !cutoffPassed && orderCount < slot.capacity,
        reason: cutoffPassed
          ? `Booking closed - cutoff time passed (${slot.cutoffHours} hour before delivery)`
          : (orderCount >= slot.capacity ? 'Slot full' : 'Available')
      };
    }));

    console.log('================================');

    // Prevent caching of time-sensitive availability data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(availability);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ success: false, message: 'Error checking availability' });
  }
});

module.exports = router;
