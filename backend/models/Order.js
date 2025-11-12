const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { 
    type:String, 
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
    quantity: { 
      type: Number, 
      required: true,
      min: 1
    },
    price: { 
      type: Number, 
      required: true 
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
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  // ADD THIS FIELD - it's missing from your schema
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
    required: true,
    enum: ['7:00 AM – 10:00 AM', '12:00 PM – 2:00 PM', '5:00 PM – 8:00 PM']
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Order', OrderSchema);