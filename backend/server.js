process.env.TZ = 'Asia/Kolkata';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cache = require('./services/redis').cache;
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;
const BACKEND_URL = process.env.BACKEND_URL;

// CORS configuration
const allowedOrigins = [
  "https://rgbasket.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "capacitor://localhost",
  "app://localhost"
];

if (CLIENT_URL) {
  const cleanUrl = CLIENT_URL.replace(/\/$/, "");
  if (!allowedOrigins.includes(cleanUrl)) {
    allowedOrigins.push(cleanUrl);
  }
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Helmet for security headers - Adjusted for local HTTP testing
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "http://localhost:*", "ws://localhost:*"], // Secure but flexible for local dev/FCM
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: false, // Disable HSTS to allow local HTTP testing
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Strict rate limiting for Admin Login
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per 15 mins
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('✅ MongoDB connected successfully to mongodb database: rgbasketdb');
    // Cleanup obsolete indexes for Offers collection
    try {
      const collections = await mongoose.connection.db.listCollections({ name: 'offers' }).toArray();
      if (collections.length > 0) {
        await mongoose.connection.db.collection('offers').dropIndex('code_1').catch(e => {
          // Ignore error if index doesn't exist
        });
        console.log('🧹 Cleaned up obsolete offer indexes');
      }
    } catch (err) {
      console.log('ℹ️ No obsolete offer indexes to clean');
    }
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));


// Redis connection
try {
  const { connectRedis } = require('./services/redis');
  connectRedis().then(() => {
    console.log('✅ Redis initialization completed');
  }).catch(err => {
    console.log('⚠️ Redis setup failed, but app continues normally');
  });
} catch (error) {
  console.log('⚠️ Redis service not available, continuing without cache');
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// Safe cache fallback for Redis issues
const safeCache = (duration) => {
  return (req, res, next) => {
    try {
      const cache = require('./services/redis').cache;
      return cache(duration)(req, res, next);
    } catch (error) {
      next();
    }
  };
};

// Import routes
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');
const addressRoutes = require('./routes/addresses');
const categoryRoutes = require('./routes/categories');
const geocodeRoutes = require('./routes/geocode');
const slotsRoutes = require('./routes/slots');
const productSlotAvailabilityRoutes = require('./routes/productSlotAvailability');
const promoCodeRoutes = require('./routes/promoCodeRoutes');
const bannerRoutes = require('./routes/banners');
const offerRoutes = require('./routes/offerRoutes');
const serviceAreaRoutes = require('./routes/serviceAreas');
const deliveryPartnerRoutes = require('./routes/deliveryPartnerRoutes');
const rewardSettingsRoutes = require('./routes/rewardSettings');
const CoinService = require('./services/CoinService');

// Import middleware
const { checkBanned } = require('./middleware/auth');

// Use routes
app.use('/api/admin/login', adminLoginLimiter); // Apply strict limit to login only
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/product-slot-availability', productSlotAvailabilityRoutes);
app.use('/api/promo', promoCodeRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/service-areas', serviceAreaRoutes);
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/feeds', require('./routes/feeds'));
app.use('/api/sitemap', require('./routes/sitemap'));
app.use('/api/delivery-partners', deliveryPartnerRoutes);
app.use('/api/reward-settings', rewardSettingsRoutes);


// Your existing routes
app.post('/api/auth/google', async (req, res) => {
  try {
    const { googleId, name, email, photo, referralCode, deviceId } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let user = await User.findOne({ googleId });
    let totalCoinsAwarded = 0;
    let awardMessage = "";

    if (user) {
      user.name = name;
      user.photo = photo;
      user.lastActive = new Date(); // Update last active

      // Update deviceId if it changed or was missing
      if (deviceId && user.deviceId !== deviceId) {
        user.deviceId = deviceId;
      }

      // REMOVED LATE REFERRAL LOGIC: Existing users cannot add referral codes to get more coins.

      user.lastIp = ipAddress;
      await user.save();
      console.log('User updated:', user.email);
      res.status(200).json({
        message: 'Login successful',
        user,
        coinsAwarded: 0,
        awardMessage: ""
      });
    } else {
      let referredBy = null;
      let usedReferral = false;

      if (referralCode) {
        const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        if (referrer) {
          // ANTI-CHEAT: Check if ANY account was already created on this device/IP
          const duplicateUser = await User.findOne({
            $or: [
              { deviceId: deviceId || 'MISSING-ID' },
              { lastIp: ipAddress }
            ]
          });

          if (!duplicateUser) {
            referredBy = referrer._id;
            usedReferral = true;
            console.log(`User ${email} referred by ${referrer.email}`);
          } else {
            console.log(`[FRAUD ALERT] Referral blocked for ${email}: Device/IP already used by ${duplicateUser.email}`);
          }
        }
      }

      user = new User({
        googleId,
        name,
        email,
        photo,
        referredBy,
        deviceId, // Store the device fingerprint
        lastIp: ipAddress, // Store IP for fraud detection
        lastActive: new Date() // Set last active for new user
      });
      await user.save();

      // --- HARD MODE SECURITY: AWARD COINS ONLY TO UNIQUE DEVICES ---
      const isDuplicateDevice = await User.findOne({
        $or: [
          { deviceId: deviceId || 'MISSING-ID' },
          { lastIp: ipAddress }
        ],
        _id: { $ne: user._id } // Don't count the user we just created
      });

      if (isDuplicateDevice) {
        console.log(`[FRAUD BLOCKED] User ${email} joined from a duplicate device/IP (${deviceId}). Awarding 0 coins.`);
        totalCoinsAwarded = 0;
        awardMessage = "Account created. No joining bonus awarded for duplicate devices.";
      } else {
        // Award Bonus Coins ONLY to unique users
        if (usedReferral) {
          // If referred and unique, they get ONLY the Referral Bonus (e.g. 300)
          try {
            const refTrans = await CoinService.awardRefereeBonus(user._id);
            if (refTrans) {
              totalCoinsAwarded += refTrans.amount;
              awardMessage = "Referral Join Bonus awarded!";
            }
          } catch (refBonusError) {
            console.error('Error awarding referral bonus:', refBonusError);
          }
        } else {
          // Normal unique users get ONLY the Welcome Bonus (e.g. 100)
          try {
            const welcomeTrans = await CoinService.awardWelcomeBonus(user._id);
            if (welcomeTrans) {
              totalCoinsAwarded += welcomeTrans.amount;
              awardMessage = "Welcome Bonus awarded!";
            }
          } catch (bonusError) {
            console.error('Error awarding welcome bonus:', bonusError);
          }
        }
      }

      // Fetch the updated user with coins
      const updatedUser = await User.findById(user._id);

      console.log('New user created:', user.email);
      res.status(201).json({
        message: 'User created successfully',
        user: updatedUser,
        coinsAwarded: totalCoinsAwarded,
        awardMessage
      });
    }

  } catch (error) {
    console.error('Error in Google authentication endpoint:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ DAU FIX: Status heartbeat endpoint
app.get('/api/auth/status/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const query = mongoose.isValidObjectId(userId) ? { _id: userId } : { googleId: userId };

    // Update lastActive timestamp on every heartbeat
    const user = await User.findOneAndUpdate(
      query,
      { lastActive: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      lastActive: user.lastActive,
      isBanned: user.isBanned || false,
      message: 'Status updated'
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user intent (Cart Snapshot & Browsed Category)
app.patch('/api/users/:userId/intent', async (req, res) => {
  try {
    const { cartItems, category } = req.body;
    const userId = req.params.userId;

    const query = mongoose.isValidObjectId(userId)
      ? { _id: userId }
      : { googleId: userId };

    const updateData = { lastActive: new Date() };

    if (cartItems) {
      updateData.lastCartSnapshot = {
        items: cartItems,
        updatedAt: new Date()
      };
    }

    if (category) {
      updateData.lastBrowsedCategory = category;
      updateData.browsingActivity = new Date();
    }

    await User.findOneAndUpdate(query, updateData);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user intent:', error);
    res.status(500).json({ success: false });
  }
});

// Update user push token
app.patch('/api/users/:userId/push-token', async (req, res) => {
  try {
    const { token, platform } = req.body;
    const userId = req.params.userId;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const query = mongoose.isValidObjectId(userId)
      ? { _id: userId }
      : { googleId: userId };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update main token for backward compatibility
    user.pushToken = token;

    // Manage pushTokens array for multiple devices
    if (!user.pushTokens) user.pushTokens = [];
    
    const existingIndex = user.pushTokens.findIndex(t => t.token === token);
    if (existingIndex > -1) {
      user.pushTokens[existingIndex].lastUpdated = new Date();
      if (platform) user.pushTokens[existingIndex].platform = platform;
    } else {
      user.pushTokens.push({ token, platform, lastUpdated: new Date() });
    }

    // Limit to 5 tokens per user to prevent bloat
    if (user.pushTokens.length > 5) {
      user.pushTokens.sort((a, b) => b.lastUpdated - a.lastUpdated);
      user.pushTokens = user.pushTokens.slice(0, 5);
    }

    await user.save();
    res.json({ success: true, message: 'Push token updated' });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({ success: false });
  }
});


// Update user profile
app.put('/api/users/:userId', checkBanned, async (req, res) => {
  try {
    const { name, email, phone, photo } = req.body;

    const userId = req.params.userId;
    const query = mongoose.isValidObjectId(userId)
      ? { _id: userId }
      : { googleId: userId };

    const user = await User.findOneAndUpdate(
      query,
      { name, email, phone, photo, lastActive: new Date() }, // Update last active
      { new: true }
    ).select('-googleId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Get user details
app.get('/api/users/:userId', checkBanned, async (req, res) => {
  try {
    const userId = req.params.userId;
    const query = mongoose.isValidObjectId(userId)
      ? { _id: userId }
      : { googleId: userId };

    const user = await User.findOneAndUpdate(
      query,
      { lastActive: new Date() }, // Update activity on every profile fetch
      { new: true }
    ).select('-googleId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
});

// Delete user account
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const query = mongoose.isValidObjectId(userId)
      ? { _id: userId }
      : { googleId: userId };

    const deletedUser = await User.findOneAndDelete(query);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`🗑️ Account deleted: ${deletedUser.email}`);
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
});

// Get orders for specific user
app.get('/api/orders/user/:userId', checkBanned, async (req, res) => {
  try {
    const userId = req.params.userId;
    const Order = require('./models/Order');
    const User = require('./models/User');

    // Smart ID lookup to handle both MongoDB _id and googleId
    const user = await User.findOne({
      $or: [
        { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null },
        { googleId: userId }
      ].filter(q => (q._id !== null && q._id !== undefined) || q.googleId !== undefined)
    });

    const userIds = [userId];
    if (user) {
      if (user._id) userIds.push(user._id.toString());
      if (user.googleId) userIds.push(user.googleId);
    }

    const uniqueUserIds = [...new Set(userIds.filter(id => id))];
    const orders = await Order.find({ user: { $in: uniqueUserIds } })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user orders'
    });
  }
});

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working! Connected to local MongoDB' });
});

// Test uploads route
app.get('/api/test-uploads', (req, res) => {
  res.json({ message: 'Uploads directory is accessible' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const now = new Date();
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: now.toISOString(),
    timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
    istTime: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Serve static files from the React app
const frontendPath = path.join(__dirname, '../clint/dist');
app.use(express.static(frontendPath));

// Catch-all route to serve the React app for any non-API requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
