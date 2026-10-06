const NotificationBatch = require('../models/NotificationBatch');
const FirebaseAdminService = require('./firebaseAdmin');

let schedulerInterval = null;
let isProcessing = false;

// Helper to determine if current time falls within Quiet Hours (IST - UTC+5:30)
function isQuietHours(startHour = 22, endHour = 7) {
  const now = new Date();
  // Calculate IST hour
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const istMinutesTotal = (utcHours * 60 + utcMinutes) + (5 * 60 + 30);
  const istHour = Math.floor((istMinutesTotal % 1440) / 60);

  if (startHour > endHour) {
    // Overnight window, e.g. 22:00 to 07:00
    return istHour >= startHour || istHour < endHour;
  } else {
    return istHour >= startHour && istHour < endHour;
  }
}

// Calculate the next active time after quiet hours end
function getWakeUpTime(endHour = 7) {
  const now = new Date();
  const wakeUp = new Date(now);
  // Add 1 hour or set to upcoming endHour
  wakeUp.setMinutes(wakeUp.getMinutes() + 30);
  return wakeUp;
}

const NotificationScheduler = {
  init() {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
    }
    console.log('⏰ NotificationScheduler: Initializing automated batch dispatcher worker...');
    
    // Check every 25 seconds for batches due for dispatch
    schedulerInterval = setInterval(() => {
      NotificationScheduler.checkDueBatches().catch(err => {
        console.error('❌ NotificationScheduler check error:', err);
      });
    }, 25000);

    // Run first check 5 seconds after startup
    setTimeout(() => {
      NotificationScheduler.checkDueBatches().catch(() => {});
    }, 5000);
  },

  async checkDueBatches() {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const now = new Date();
      // Find active batches that are due to fire
      const dueBatches = await NotificationBatch.find({
        isActive: true,
        status: { $in: ['running', 'scheduled'] },
        items: { $exists: true, $not: { $size: 0 } },
        $or: [
          { nextRunAt: { $lte: now } },
          { nextRunAt: null }
        ]
      });

      for (const batch of dueBatches) {
        try {
          await NotificationScheduler.dispatchBatchNotification(batch);
        } catch (err) {
          console.error(`❌ Error dispatching batch "${batch.name}":`, err);
        }
      }
    } catch (error) {
      console.error('NotificationScheduler tick error:', error);
    } finally {
      isProcessing = false;
    }
  },

  async dispatchBatchNotification(batch, isManualTrigger = false) {
    if (!batch.items || batch.items.length === 0) {
      batch.isActive = false;
      batch.status = 'paused';
      await batch.save();
      return { success: false, message: 'Batch has no notifications configured.' };
    }

    // 1. Check Quiet Hours (unless explicitly triggered manually by admin)
    if (!isManualTrigger && batch.quietHours?.enabled) {
      const { startHour = 22, endHour = 7 } = batch.quietHours;
      if (isQuietHours(startHour, endHour)) {
        console.log(`🌙 Batch "${batch.name}" skipped dispatch due to Quiet Hours (IST). Rescheduling...`);
        batch.nextRunAt = getWakeUpTime(endHour);
        await batch.save();
        return { success: false, message: 'Skipped due to quiet hours. Rescheduled for morning.' };
      }
    }

    // 2. Select item to send based on orderMode
    let selectedItemIndex = 0;
    const totalItems = batch.items.length;

    if (batch.orderMode === 'random') {
      // Find items with minimum sent count to ensure fair rotation
      const minSent = Math.min(...batch.items.map(i => i.sentCount || 0));
      const candidates = batch.items
        .map((item, idx) => ({ item, idx }))
        .filter(c => (c.item.sentCount || 0) === minSent);

      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      selectedItemIndex = chosen ? chosen.idx : Math.floor(Math.random() * totalItems);
    } else {
      // Sequential mode
      selectedItemIndex = (batch.currentIndex || 0) % totalItems;
    }

    const item = batch.items[selectedItemIndex];
    if (!item) {
      return { success: false, message: 'Could not select notification item.' };
    }

    console.log(`🚀 [Batch Dispatch] Firing notification #${selectedItemIndex + 1}/${totalItems} from batch "${batch.name}": "${item.title}"`);

    // 3. Dispatch via Firebase FCM Broadcast
    let deliveryResult = { successCount: 0, totalTokens: 0 };
    let errorMsg = '';
    let status = 'success';

    try {
      deliveryResult = await FirebaseAdminService.broadcast(
        item.title,
        item.body,
        {
          path: item.targetPath || '/',
          image: item.imageUrl || '',
          batchId: batch._id.toString(),
          batchName: batch.name
        }
      );
    } catch (fcmError) {
      console.error('❌ Failed FCM delivery in batch:', fcmError);
      errorMsg = fcmError.message || 'FCM dispatch failed';
      status = 'failed';
    }

    // 4. Update counters and progress
    const now = new Date();
    item.sentCount = (item.sentCount || 0) + 1;
    item.lastSentAt = now;

    batch.lastRunAt = now;
    if (batch.status === 'scheduled') {
      batch.status = 'running';
    }
    batch.stats = batch.stats || {};
    batch.stats.totalDispatched = (batch.stats.totalDispatched || 0) + 1;
    batch.stats.lastDispatchedTitle = item.title;
    batch.stats.lastDispatchedDevices = deliveryResult.successCount || 0;
    batch.stats.lastError = errorMsg;

    // Advance sequence pointer
    if (batch.orderMode === 'sequential') {
      const nextIndex = selectedItemIndex + 1;
      if (nextIndex >= totalItems) {
        if (!batch.repeatMode) {
          // One-shot sequence completed!
          batch.currentIndex = 0;
          batch.isActive = false;
          batch.status = 'completed';
          batch.nextRunAt = null;
        } else {
          // Loop back to start
          batch.currentIndex = 0;
          batch.nextRunAt = new Date(Date.now() + (batch.intervalMinutes || 60) * 60 * 1000);
        }
      } else {
        batch.currentIndex = nextIndex;
        batch.nextRunAt = new Date(Date.now() + (batch.intervalMinutes || 60) * 60 * 1000);
      }
    } else {
      // Random mode: check if all have been sent at least once if !repeatMode
      if (!batch.repeatMode) {
        const allSent = batch.items.every(i => (i.sentCount || 0) > 0);
        if (allSent) {
          batch.isActive = false;
          batch.status = 'completed';
          batch.nextRunAt = null;
        } else {
          batch.nextRunAt = new Date(Date.now() + (batch.intervalMinutes || 60) * 60 * 1000);
        }
      } else {
        batch.nextRunAt = new Date(Date.now() + (batch.intervalMinutes || 60) * 60 * 1000);
      }
    }

    // 5. Prepend to Audit Log
    batch.dispatchLogs = batch.dispatchLogs || [];
    batch.dispatchLogs.unshift({
      itemId: item.id,
      title: item.title,
      body: item.body,
      imageUrl: item.imageUrl,
      targetPath: item.targetPath,
      sentAt: now,
      devicesReached: deliveryResult.successCount || 0,
      status,
      error: errorMsg
    });

    // Keep last 50 logs only
    if (batch.dispatchLogs.length > 50) {
      batch.dispatchLogs = batch.dispatchLogs.slice(0, 50);
    }

    await batch.save();

    return {
      success: true,
      itemTitle: item.title,
      devicesReached: deliveryResult.successCount || 0,
      nextRunAt: batch.nextRunAt,
      currentIndex: batch.currentIndex,
      status: batch.status
    };
  },

  async triggerBatchNow(batchId) {
    const batch = await NotificationBatch.findById(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }
    return await NotificationScheduler.dispatchBatchNotification(batch, true);
  }
};

module.exports = NotificationScheduler;
