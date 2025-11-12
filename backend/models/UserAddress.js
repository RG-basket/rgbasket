const mongoose = require('mongoose');

const UserAddressSchema = new mongoose.Schema({
  user: {
    type: String, // Changed from ObjectId to String to accept Google IDs
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  alternatePhone: {
    type: String,
    default: ''
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  locality: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
  },
  landmark: {
    type: String,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure only one default address per user
UserAddressSchema.pre('save', async function(next) {
  if (this.isDefault && this.user) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model('UserAddress', UserAddressSchema);