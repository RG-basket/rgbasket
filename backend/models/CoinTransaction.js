const mongoose = require('mongoose');

const CoinTransactionSchema = new mongoose.Schema({
  userId: {
    type: String, // String to match User googleId or _id as used in the project
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['EARNED_ORDER', 'SPENT_ORDER', 'REFERRAL_REWARD', 'REFERRAL_BONUS', 'WELCOME_BONUS', 'ADMIN_ADJUST', 'EXPIRED', 'REVERSED'],
    required: true
  },
  referenceId: {
    type: String, // Can be Order ID or Admin User ID
    default: null
  },
  runningBalance: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CoinTransaction', CoinTransactionSchema);