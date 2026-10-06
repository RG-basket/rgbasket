const mongoose = require('mongoose');

const NotificationItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  targetPath: {
    type: String,
    default: '/'
  },
  tag: {
    type: String,
    default: 'General'
  },
  sentCount: {
    type: Number,
    default: 0
  },
  lastSentAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const DispatchLogSchema = new mongoose.Schema({
  itemId: String,
  title: String,
  body: String,
  imageUrl: String,
  targetPath: String,
  sentAt: {
    type: Date,
    default: Date.now
  },
  devicesReached: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  error: {
    type: String,
    default: ''
  }
}, { _id: false });

const NotificationBatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  items: [NotificationItemSchema],
  
  // Timer & Schedule Settings
  intervalMinutes: {
    type: Number,
    required: true,
    default: 60, // Default 1 hour
    min: 1
  },
  orderMode: {
    type: String,
    enum: ['sequential', 'random'],
    default: 'sequential'
  },
  repeatMode: {
    type: Boolean,
    default: true // Loop when finished vs run once
  },
  
  // Execution State
  isActive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed', 'scheduled'],
    default: 'draft'
  },
  startMode: {
    type: String,
    enum: ['immediate', 'interval', 'scheduled'],
    default: 'immediate'
  },
  scheduledStartTime: {
    type: Date,
    default: null
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  nextRunAt: {
    type: Date,
    default: null
  },
  lastRunAt: {
    type: Date,
    default: null
  },

  // Quiet Hours (Do Not Disturb late at night)
  quietHours: {
    enabled: {
      type: Boolean,
      default: true
    },
    startHour: {
      type: Number,
      default: 22 // 10:00 PM
    },
    endHour: {
      type: Number,
      default: 7 // 7:00 AM
    }
  },

  // Aggregate Metrics & Audit Log
  stats: {
    totalDispatched: {
      type: Number,
      default: 0
    },
    lastDispatchedTitle: {
      type: String,
      default: ''
    },
    lastDispatchedDevices: {
      type: Number,
      default: 0
    },
    lastError: {
      type: String,
      default: ''
    }
  },
  dispatchLogs: [DispatchLogSchema]
}, { timestamps: true });

module.exports = mongoose.model('NotificationBatch', NotificationBatchSchema);
