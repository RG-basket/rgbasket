const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  userInfo: {
    name: {
      type: String,
      required: true,
      default: 'Guest'
    },
    email: {
      type: String,
      default: ''
    },
    photo: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      required: true
    }
  },
  items: [{
    productId: {
      type: String,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    weight: {
      type: String,
      required: true
    },
    unit: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    // Customization fields
    isCustomized: {
      type: Boolean,
      default: false
    },
    customizationInstructions: {
      type: String,
      default: ''
    },
    customizationCharge: {
      type: Number,
      default: 0
    },
    image: {
      type: String,
      default: ''
    },
    userName: {
      type: String,
      required: true,
      default: 'Guest'
    },
    userImage: {
      type: String,
      default: ''
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    required: true,
    default: 29
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  promoCode: {
    type: String, // Storing code string for easy reference, could be ObjectId if strict relation needed
    default: null
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  originalTotal: {
    type: Number, // Total before discount
    default: 0
  },
  finalTotal: {
    type: Number, // Total after discount (should match totalAmount if no discount)
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveredAt: {
    type: Date
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    alternatePhone: { type: String, default: '' },
    street: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String, default: '' }
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'card', 'upi'],
    default: 'cash_on_delivery'
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  liveLocation: {
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    accuracy: { type: Number },
    timestamp: { type: Date }
  },
  deliveryLocation: {
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    accuracy: { type: Number },
    timestamp: { type: Date },
    source: { type: String, enum: ['live', 'saved', 'admin', 'historical'], default: 'live' }
  },
  instruction: {
    type: String,
    default: '',
    maxLength: 1000
  },
  selectedGift: {
    type: String,
    default: null
  },
  tipAmount: {
    type: Number,
    default: 0
  },
  // Keep legacy location field for backward compatibility (prevents data stripping)
  location: {
    type: Object,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Logic to check if an order can be cancelled
OrderSchema.virtual('isCancellable').get(function () {
  const cancellableStatuses = ['pending', 'confirmed'];
  return cancellableStatuses.includes(this.status);
});

// Method to perform cancellation
OrderSchema.methods.cancelOrder = async function (reason = 'Cancelled by user') {
  if (!this.isCancellable) {
    throw new Error('Order cannot be cancelled at this stage');
  }

  this.status = 'cancelled';
  this.statusHistory = this.statusHistory || [];
  this.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    comment: reason
  });

  return await this.save();
};

// Indexes for performance
OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'deliveryLocation.coordinates.latitude': 1, 'deliveryLocation.coordinates.longitude': 1 });
OrderSchema.index({ 'liveLocation.coordinates.latitude': 1, 'liveLocation.coordinates.longitude': 1 });
OrderSchema.index({ promoCode: 1 });

OrderSchema.virtual('deliveryLocation.googleMapsUrl').get(function () {
  if (this.deliveryLocation?.coordinates?.latitude && this.deliveryLocation?.coordinates?.longitude) {
    return `https://www.google.com/maps?q=${this.deliveryLocation.coordinates.latitude},${this.deliveryLocation.coordinates.longitude}`;
  }
  return null;
});

OrderSchema.virtual('liveLocation.googleMapsUrl').get(function () {
  if (this.liveLocation?.coordinates?.latitude && this.liveLocation?.coordinates?.longitude) {
    return `https://www.google.com/maps?q=${this.liveLocation.coordinates.latitude},${this.liveLocation.coordinates.longitude}`;
  }
  return null;
});

// Coordinate validation for deliveryLocation
OrderSchema.path('deliveryLocation.coordinates.latitude').validate(function (value) {
  if (value !== undefined && value !== null) {
    return value >= -90 && value <= 90;
  }
  return true;
}, 'Latitude must be between -90 and 90');

OrderSchema.path('deliveryLocation.coordinates.longitude').validate(function (value) {
  if (value !== undefined && value !== null) {
    return value >= -180 && value <= 180;
  }
  return true;
}, 'Longitude must be between -180 and 180');

module.exports = mongoose.model('Order', OrderSchema);