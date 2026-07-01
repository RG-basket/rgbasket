const mongoose = require('mongoose');

const SurgeConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SurgeConfig', SurgeConfigSchema);
