// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Unique identifier provided by Google
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  // User's display name
  name: {
    type: String,
    required: true
  },
  // User's email address
  email: {
    type: String,
    required: true,
    unique: true // Ensures the same email can't register twice
  },
  // Profile photo URL from Google
  photo: {
    type: String,
    default: '' // It's optional, some users might not have a photo
  },
  // User status - active or banned
  active: {
    type: Boolean,
    default: true
  },
  // Specifically to track formal bans
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  // Admin privileges
  isAdmin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  // Phone number (optional)
  phone: {
    type: String,
    default: ''
  },
  // Last seen/activity timestamp
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Behavior & Intent Tracking (Storage Optimized)
  lastCartSnapshot: {
    items: [{
      productId: String,
      name: String,
      quantity: Number,
      price: Number,
      weight: String
    }],
    updatedAt: { type: Date, default: Date.now }
  },
  lastBrowsedCategory: {
    type: String,
    default: ''
  },
  browsingActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This automatically adds `createdAt` and `updatedAt` fields
});

// Create the model from the schema
module.exports = mongoose.model('User', UserSchema);