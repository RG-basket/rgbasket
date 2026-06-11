const express = require('express');
const router = express.Router();
const SlotConfig = require('../models/SlotConfig');
const Order = require('../models/Order');
const { authenticateAdminOr404 } = require('../middleware/auth');

/* -------------------------------
   IST Timezone Utilities
--------------------------------- */
// Since process.env.TZ = 'Asia/Kolkata' is set in server.js,
// new Date() already returns IST time. No offset calculation needed!

// Get current date/time in IST
const getISTDate = () => {
  // process.env.TZ is already set to 'Asia/Kolkata', so new Date() returns IST
  return new Date();
};

// Parse a date string (YYYY-MM-DD) as IST midnight
const parseISTDate = (dateString) => {
  // Parse as IST midnight by appending IST timezone offset
  return new Date(dateString + 'T00:00:00+05:30');
};

// Format date as YYYY-MM-DD in IST
const formatISTDate = (date) => {
  // Since TZ is IST, we can use local date methods directly
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/* -------------------------------
   Slot Initialization - DISABLED
   (Automatic creation removed to allow manual management)
--------------------------------- */
// Automatic slot initialization removed as per user request to prevent recreation of default slots.

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

// DELETE /api/slots/:id - Delete slot config (Admin)
router.delete('/:id', authenticateAdminOr404, async (req, res) => {
  try {
    const slot = await SlotConfig.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({ success: false, message: 'Error deleting slot' });
  }
});

/* -------------------------------
   Availability Route - ULTRA SIMPLE WORKING SOLUTION
--------------------------------- */

// SIMPLE: Check if cutoff has passed (using IST)
const hasCutoffPassed = (slot, selectedDate, now) => {
  // Get today's date at 00:00:00 IST
  const today = getISTDate();
  today.setHours(0, 0, 0, 0);

  // Get selected date at 00:00:00 IST
  const selected = parseISTDate(selectedDate);
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

  // Create slot time for today in IST
  const slotTime = new Date(today);
  slotTime.setHours(hours, minutes, 0, 0);

  // Calculate cutoff time (cutoffMinutes before slot start)
  const cutoffTime = new Date(slotTime.getTime() - (slot.cutoffMinutes * 60 * 1000));

  // Check if current IST time is past cutoff
  const currentIST = getISTDate();
  return currentIST > cutoffTime;
};

// GET /api/slots/availability - IST TIMEZONE AWARE
router.get('/availability', async (req, res) => {
  try {
    const { date, categories, products } = req.query; // YYYY-MM-DD, categories: comma-separated list, products: comma-separated list
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const now = getISTDate(); // Current time in IST
    const selectedDate = parseISTDate(date); // Parse date as IST midnight

    console.log('\n=== SLOT AVAILABILITY (IST) ===');
    console.log(`Requested date: ${date}`);
    console.log(`Current IST time: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`Server timezone: ${process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`Is today (IST)? ${selectedDate.toDateString() === getISTDate().toDateString()}`);
    console.log(`Requested categories: ${categories || 'None'}`);
    console.log(`Requested products: ${products || 'None'}`);

    const slots = await SlotConfig.find({ isActive: true }).sort({ startTime: 1 });

    // Fetch category slot restrictions for this date
    const CategorySlotAvailability = require('../models/CategorySlotAvailability');
    const categoryList = categories ? categories.split(',').map(c => c.trim()) : [];
    const activeRestrictions = await CategorySlotAvailability.find({
      date,
      isActive: true,
      category: { $in: [...categoryList, 'All'] }
    });

    // Fetch product slot restrictions for this day of week
    const ProductSlotAvailability = require('../models/ProductSlotAvailability');
    const productList = products ? products.split(',').map(p => p.trim()).filter(Boolean) : [];
    let productRestrictions = [];
    if (productList.length > 0) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const [year, month, day] = date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const dayOfWeek = days[d.getDay()];
      productRestrictions = await ProductSlotAvailability.find({
        productId: { $in: productList },
        dayOfWeek,
        isActive: true
      }).populate('productId', 'name');
    }

    const availability = await Promise.all(slots.map(async (slot) => {
      // IST-aware cutoff check
      const cutoffPassed = hasCutoffPassed(slot, date, now);

      // Check category slot restrictions
      let categoryRestricted = false;
      let restrictionReason = '';

      for (const restriction of activeRestrictions) {
        if (restriction.unavailableSlots.includes(slot.name)) {
          categoryRestricted = true;
          restrictionReason = restriction.reason || `${restriction.category} is unavailable for this slot`;
          break;
        }
      }

      // Check product slot restrictions
      let productRestricted = false;
      let productRestrictionReason = '';

      for (const restriction of productRestrictions) {
        if (restriction.unavailableSlots.includes(slot.name)) {
          productRestricted = true;
          productRestrictionReason = restriction.reason || `Product "${restriction.productId?.name || 'Item'}" is unavailable for this slot`;
          break;
        }
      }

      // Count orders for the date (using IST date range)
      const startOfDay = parseISTDate(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = parseISTDate(date);
      endOfDay.setHours(23, 59, 59, 999);

      const orderCount = await Order.countDocuments({
        deliveryDate: { $gte: startOfDay, $lte: endOfDay },
        timeSlot: slot.name
      });

      const isAvailable = !cutoffPassed && orderCount < slot.capacity && !categoryRestricted && !productRestricted;

      // Debug log
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hours, minutes, 0, 0);
      const cutoffTime = new Date(slotTime.getTime() - (slot.cutoffMinutes * 60 * 1000));

      console.log(`${slot.name}:`);
      console.log(`  Slot time: ${slotTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  Cutoff time: ${cutoffTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  Current IST: ${now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  Cutoff passed: ${cutoffPassed}`);
      console.log(`  Category restricted: ${categoryRestricted} (${restrictionReason})`);
      console.log(`  Product restricted: ${productRestricted} (${productRestrictionReason})`);
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
          ? `Booking closed - cutoff time passed (${slot.cutoffMinutes} min before delivery)`
          : (orderCount >= slot.capacity 
              ? 'Slot full' 
              : (categoryRestricted 
                  ? restrictionReason 
                  : (productRestricted ? productRestrictionReason : 'Available')))
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