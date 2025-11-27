const redis = require('redis');

class RedisManager {
  constructor() {
    this.isRedisConnected = false;
    this.client = null;
    this.connectionAttempts = 0;
    this.MAX_CONNECTION_ATTEMPTS = 2;
    this.init();
  }

  init() {
    const config = this.getRedisConfig();

    if (config.skip) {
      console.log('🚫 Redis not configured - running without cache');
      this.isRedisConnected = false;
      return;
    }

    console.log('🔌 Initializing Redis client...');
    this.client = redis.createClient(config);
    this.setupEventListeners();
    this.connect();
  }

  getRedisConfig() {
    const host = process.env.REDIS_HOST;
    const port = parseInt(process.env.REDIS_PORT || '6379');
    const password = process.env.REDIS_PASSWORD;
    const username = process.env.REDIS_USERNAME;

    console.log('🔍 Redis Environment Check:');
    console.log('   REDIS_HOST:', host || 'Not set');
    console.log('   REDIS_PORT:', port);
    console.log('   REDIS_PASSWORD:', password ? '***' : 'Not set');
    console.log('   REDIS_USERNAME:', username || 'Not set');

    // If no Redis configuration is provided, don't attempt to connect
    if (!host || host === 'localhost') {
      console.log('ℹ️  No external Redis configured - skipping Redis');
      return { skip: true };
    }

    // For Redis Labs - try without TLS first (port 10507 might not support TLS)
    if (host.includes('redislabs.com') || host.includes('rediscloud.com')) {
      console.log('🔌 Configuring Redis Labs connection');

      if (!password) {
        console.log('❌ Redis Labs requires password');
        return { skip: true };
      }

      console.log('🔌 Using non-TLS configuration for Redis Labs (port may not support TLS)');

      const config = {
        socket: {
          host: host,
          port: port,
          reconnectStrategy: (retries) => {
            if (retries >= this.MAX_CONNECTION_ATTEMPTS) {
              console.log('❌ Max Redis reconnection attempts reached');
              return false;
            }
            console.log(`🔄 Redis reconnection attempt: ${retries + 1}`);
            return Math.min(retries * 1000, 5000);
          },
          connectTimeout: 15000,
        }
      };

      // Add authentication
      if (username) config.username = username;
      if (password) config.password = password;

      return config;
    }

    // Standard host/port configuration for other providers
    console.log(`🔌 Configuring Redis: ${host}:${port}`);
    const config = {
      socket: {
        host: host,
        port: port,
        reconnectStrategy: (retries) => {
          if (retries >= this.MAX_CONNECTION_ATTEMPTS) {
            console.log('❌ Max Redis reconnection attempts reached');
            return false;
          }
          console.log(`🔄 Redis reconnection attempt: ${retries + 1}`);
          return Math.min(retries * 1000, 5000);
        },
        connectTimeout: 15000,
      }
    };

    // Add authentication
    if (username) config.username = username;
    if (password) config.password = password;

    // Enable TLS for cloud providers
    const isCloudProvider = host.includes('upstash') ||
      host.endsWith('.com') ||
      port !== 6379;

    if (isCloudProvider) {
      console.log('🔒 TLS Enabled for Cloud Redis');
      config.socket.tls = true;
      config.socket.rejectUnauthorized = false;
      config.socket.servername = host;
    }

    return config;
  }

  setupEventListeners() {
    this.client.on('error', (err) => {
      console.log('❌ Redis Error:', err.message);
      this.isRedisConnected = false;
    });

    this.client.on('connect', () => {
      console.log('🔌 Redis Connecting...');
      this.connectionAttempts++;
    });

    this.client.on('ready', () => {
      console.log('✅ Redis Connected Successfully');
      this.isRedisConnected = true;
      this.connectionAttempts = 0;
    });

    this.client.on('end', () => {
      console.log('🔴 Redis Connection Closed');
      this.isRedisConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log(`🔄 Redis Reconnecting...`);
    });
  }

  async connect() {
    if (!this.client) return;

    try {
      console.log('🎯 Attempting Redis connection...');
      await this.client.connect();

      // Test connection
      const pong = await this.client.ping();
      console.log('✅ Redis initialization completed -', pong);

    } catch (err) {
      console.log('⚠️ Redis connection failed:', err.message);
      console.log('🚫 Running without Redis cache');
      this.isRedisConnected = false;

      // Close the client to prevent memory leaks
      try {
        await this.client.disconnect();
      } catch (disconnectErr) {
        // Ignore disconnect errors
      }
    }
  }

  // Cache middleware
  cache(duration) {
    return async (req, res, next) => {
      if (!this.isRedisConnected || !this.client?.isOpen) {
        return next();
      }

      const key = `express:${req.method}:${req.originalUrl || req.url}`;

      try {
        const cachedBody = await this.client.get(key);
        if (cachedBody) {
          console.log(`💾 Cache HIT: ${key}`);
          res.setHeader('X-Cache', 'HIT');
          return res.send(JSON.parse(cachedBody));
        }

        // Cache miss
        const originalSend = res.send;
        res.send = function (body) {
          if (this.isRedisConnected && this.client?.isOpen) {
            this.client.setEx(key, duration, JSON.stringify(body))
              .then(() => {
                console.log(`💾 Cache SET: ${key} (${duration}s)`);
              })
              .catch(cacheErr => {
                // Silent fail on cache write error
              });
          }
          res.setHeader('X-Cache', 'MISS');
          originalSend.call(this, body);
        }.bind(this);

        next();
      } catch (err) {
        next();
      }
    };
  }

  // Safe cache operations
  async clearPattern(pattern) {
    if (!this.isRedisConnected || !this.client?.isOpen) return 0;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Cleared ${keys.length} cache entries`);
        return keys.length;
      }
      return 0;
    } catch (err) {
      return 0;
    }
  }
}

// Create singleton instance
const redisManager = new RedisManager();

// Cache key patterns
const cacheKeys = {
  products: 'express:GET:/api/products*',
  categories: 'express:GET:/api/categories*',
  slots: 'express:GET:/api/slots$', // Only cache /api/slots, NOT /api/slots/availability (time-sensitive)
  productSlots: 'express:GET:/api/product-slot-availability*',
  admin: 'express:*:/api/admin*',
  users: 'express:*:/api/users*',
  orders: 'express:*:/api/orders*'
};

// Export functions
module.exports = {
  client: redisManager.client,
  cache: (duration) => redisManager.cache(duration),
  cacheKeys,
  clearCache: (pattern) => redisManager.clearPattern(pattern),
  clearAllCache: () => redisManager.clearPattern('express:*'),
  getCacheStats: async () => {
    if (!redisManager.isRedisConnected || !redisManager.client?.isOpen) {
      return { connected: false, message: 'Redis not available' };
    }
    try {
      const dbSize = await redisManager.client.dbSize();
      return { connected: true, totalKeys: dbSize };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  },
  isRedisConnected: () => redisManager.isRedisConnected,
  connectRedis: async () => true
};
