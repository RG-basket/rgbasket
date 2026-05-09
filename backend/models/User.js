const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  photo: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  referralCode: {
    type: String,
    unique: true,
    uppercase: true,
    default: function() {
      // Generate a unique 8-character code
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rgCoins: {
    type: Number,
    default: 0
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  deviceId: {
    type: String,
    default: ''
  },
  lastIp: {
    type: String,
    default: ''
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  lastBrowsedCategory: {
    type: String,
    default: ''
  },
  browsingActivity: {
    type: Date
  },
  lastCartSnapshot: {
    items: { type: Object },
    updatedAt: { type: Date }
  },
  pushToken: {
    type: String,
    default: ''
  },
  pushTokens: [{
    token: String,
    platform: String,
    lastUpdated: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Middleware to ensure a referral code is generated on save if missing
UserSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
