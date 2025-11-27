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
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", CLIENT_URL, BACKEND_URL],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
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

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully to mongodb database: rgbasketdb'))
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

// // Serve static files from uploads directory
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
//   setHeaders: (res, path) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
//     res.setHeader('Cache-Control', 'public, max-age=31536000');
//   }
// }));

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

// Use routes
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/product-slot-availability', productSlotAvailabilityRoutes);

// Your existing routes
app.post('/api/auth/google', async (req, res) => {
  try {
    const { googleId, name, email, photo } = req.body;

    let user = await User.findOne({ googleId });

    if (user) {
      user.name = name;
      user.photo = photo;
      await user.save();
      console.log('User updated:', user.email);
      res.status(200).json({ message: 'Login successful', user });
    } else {
      user = new User({
        googleId,
        name,
        email,
        photo
      });
      await user.save();
      console.log('New user created:', user.email);
      res.status(201).json({ message: 'User created successfully', user });
    }

  } catch (error) {
    console.error('Error in Google authentication endpoint:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/users/:userId', safeCache(900), async (req, res) => {
  try {
    const { name, email, phone, photo } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { name, email, phone, photo },
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
app.get('/api/users/:userId', safeCache(900), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-googleId');

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

// Get orders for specific user
app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const Order = require('./models/Order');
    const orders = await Order.find({ user: req.params.userId })
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
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
