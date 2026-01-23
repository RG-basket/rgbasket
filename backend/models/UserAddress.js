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
    default: '',
    validate: {
      validator: function (v) {
        // v is the value of alternatePhone being saved
        // this refers to the document being saved
        // If v is empty string or null, it's valid (optional field)
        if (!v) return true;
        return v !== this.phoneNumber;
      },
      message: 'Alternate phone number cannot be the same as primary phone number'
    }
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
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    accuracy: Number,
    capturedAt: Date
  },
  savedByAdmin: {
    type: Boolean,
    default: false
  },
  adminNote: {
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
UserAddressSchema.pre('save', async function (next) {
  if (this.isDefault && this.user) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model('UserAddress', UserAddressSchema);