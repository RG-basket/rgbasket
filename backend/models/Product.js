const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },

  description: {
    type: [String],
    required: [true, 'Product description is required'],
    validate: {
      validator: function (desc) {
        return desc.length > 0;
      },
      message: 'At least one description point is required'
    }
  },

  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true  // ✅ No enum here!
  },

  // Images
  images: [{
    type: String,
    required: [true, 'At least one product image is required']
  }],

  // Pricing & Inventory
  weights: [{
    weight: {
      type: String,
      required: [true, 'Weight label is required (e.g., 1kg, 500g)']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    offerPrice: {
      type: Number,
      required: [true, 'Offer price is required'],
      min: [0, 'Offer price cannot be negative'],
      validate: {
        validator: function (value) {
          return value <= this.price;
        },
        message: 'Offer price cannot be higher than regular price'
      }
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['kg', 'g', 'ml', 'l', 'piece', 'pack', 'dozen', 'bundle']
    },
    stock: {
      type: Number,
      default: 0
    },
    inStock: {
      type: Boolean,
      default: true
    },
    customizationCharge: {
      type: Number,
      default: 0
    },
    dailyPrices: {
      sunday: { price: { type: Number, default: null }, offerPrice: { type: Number, default: null } },
      monday: { price: { type: Number, default: null }, offerPrice: { type: Number, default: null } },
      tuesday: { price: { type: Number, default: null }, offerPrice: { type: Number, default: null } },
      wednesday: { price: { type: Number, default: null }, offerPrice: { type: Number, default: null } },
      thursday: { price: { type: Number, default: null }, offerPrice: { type: Number, default: null } },
      friday: { price: { type: Number, default: null }, offerPrice: { type: Number, default: null } },
      saturday: { price: { type: Number, default: null }, offerPrice: { type: Number, default: null } }
    }
  }],

  // Dynamic Day-Wise Pricing Indicator
  hasDayWisePricing: {
    type: Boolean,
    default: false
  },

  // Customization
  isCustomizable: {
    type: Boolean,
    default: false
  },
  customizationCharges: [{
    weight: {
      type: Number, // in grams
      required: true
    },
    charge: {
      type: Number,
      required: true
    }
  }],

  // Inventory Management
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },

  maxOrderQuantity: {
    type: Number,
    default: 0 // 0 means no limit
  },

  inStock: {
    type: Boolean,
    default: true
  },

  lowStockThreshold: {
    type: Number,
    default: 10
  },

  // Product Identification
  sku: {
    type: String,
    unique: true,
    sparse: true
  },

  // Metadata
  active: {
    type: Boolean,
    default: true
  },

  featured: {
    type: Boolean,
    default: false
  },

  // Slot Availability Configuration
  requiresSlotSelection: {
    type: Boolean,
    default: false
  },

  availableSlots: [{
    type: String,
    // e.g., ['Morning - First Half', 'Noon', 'Night - Second Half'] - restricts product to specific slots
  }],

  isSpecialRequest: {
    type: Boolean,
    default: false
  },

  specialRequestInfo: {
    type: String,
    default: '',
    trim: true
  },

  slotRestrictions: [{
    date: {
      type: String, // YYYY-MM-DD format
      required: true
    },
    slots: [{
      type: String // Array of slot names unavailable on this date
    }],
    reason: {
      type: String,
      default: 'Unavailable'
    }
  }],

  blackoutDates: [{
    type: String // YYYY-MM-DD format - dates when product is completely unavailable
  }],

  // Analytics
  meta: {
    purchases: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    }
  }
}, {
  timestamps: true
});

// Clean and normalize description array (avoid nested JSON stringification)
ProductSchema.pre('save', function (next) {
  if (this.description) {
    let cur = this.description;
    for (let i = 0; i < 10; i++) {
      if (Array.isArray(cur)) {
        if (cur.length === 1 && typeof cur[0] === 'string' && (cur[0].trim().startsWith('[') || cur[0].trim().startsWith('"{') || cur[0].trim().startsWith('\"['))) {
          try { cur = JSON.parse(cur[0]); continue; } catch (e) {}
        }
        break;
      } else if (typeof cur === 'string') {
        try { cur = JSON.parse(cur); continue; } catch (e) { break; }
      } else break;
    }
    if (Array.isArray(cur)) {
      this.description = cur
        .map(s => typeof s === 'string' ? s.trim() : '')
        .filter(s => s && s !== '[]' && s !== '.' && s !== '..');
      if (this.description.length === 0) {
        this.description = ['Fresh and premium quality'];
      }
    }
  }
  next();
});

// Update inStock based on stock
ProductSchema.pre('save', function (next) {
  this.inStock = this.stock > 0;
  next();
});

// Generate SKU if not provided
ProductSchema.pre('save', function (next) {
  if (!this.sku) {
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.sku = `${categoryCode}${randomNum}`;
  }
  next();
});

// Automatically detect if product has day-wise pricing overrides
ProductSchema.pre('save', function (next) {
  let hasSpecial = false;
  if (this.weights && Array.isArray(this.weights)) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const w of this.weights) {
      if (w.dailyPrices) {
        for (const day of days) {
          const dp = w.dailyPrices[day];
          if (dp && dp.offerPrice !== undefined && dp.offerPrice !== null && dp.offerPrice > 0) {
            hasSpecial = true;
            break;
          }
        }
      }
      if (hasSpecial) break;
    }
  }
  this.hasDayWisePricing = hasSpecial;
  next();
});

// Index for better search performance
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ active: 1 });
// ProductSchema.index({ inStock: 1 }); // Removed to avoid conflict
// ProductSchema.index({ featured: 1 }); // Removed to avoid conflict
// ProductSchema.index({ createdAt: -1 }); // Removed to avoid conflict

module.exports = mongoose.model('Product', ProductSchema);