const redis = require('redis');

// Redis configuration for production (Redis Cloud) and development
const getRedisConfig = () => {
  // Production - Use Redis Cloud
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false
      }
    };
  }
  
  // Development - fallback to localhost
  return {
    socket: {
      host: 'localhost',
      port: 6379
    }
  };
};

// Create Redis client with proper configuration
const redisClient = redis.createClient(getRedisConfig());

// Error handling - won't break your app
redisClient.on('error', (err) => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Redis Cloud Error (but app continues):', err.message);
  } else {
    console.log('Redis Client Error (but app continues):', err.message);
  }
});

redisClient.on('connect', () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Redis Cloud Connected Successfully');
  } else {
    console.log('✅ Redis Connected Successfully');
  }
});

// Connect to Redis (safe - won't crash app if Redis is down)
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      if (process.env.NODE_ENV === 'production') {
        console.log('✅ Redis Cloud Ready for Caching');
      } else {
        console.log('✅ Redis Ready for Caching');
      }
    }
  } catch (error) {
    console.log('⚠️ Redis not available, continuing without cache');
  }
};

// Safe cache middleware - ONLY for GET requests (keep your existing logic)
const cache = (duration = 1800) => { // 30 minutes default
  return async (req, res, next) => {
    // Only cache GET requests, skip others
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `cache:${req.originalUrl}`;
    
    try {
      // Try to get from cache
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        console.log('✅ Serving from Redis cache:', key);
        return res.json(JSON.parse(cachedData));
      }
      
      // If not in cache, proceed normally but cache the result
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          redisClient.setEx(key, duration, JSON.stringify(data))
            .catch(err => console.log('Cache set failed (non-critical):', err.message));
        }
        originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      // If cache fails, just continue without caching
      console.log('Cache middleware error (continuing normally):', error.message);
      next();
    }
  };
};

module.exports = { redisClient, connectRedis, cache };