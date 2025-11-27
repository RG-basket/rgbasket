const redis = require('redis');

const getRedisConfig = () => {
  // If REDIS_URL is provided (from cloud service)
  if (process.env.REDIS_URL) {
    const redisUrl = process.env.REDIS_URL;

    // Check if it's a rediss:// URL (TLS) or redis:// URL (non-TLS)
    if (redisUrl.startsWith('rediss://')) {
      // TLS connection
      return {
        url: redisUrl,
        socket: {
          tls: true,
          rejectUnauthorized: false
        }
      };
    } else {
      // Non-TLS connection (redis://)
      return {
        url: redisUrl,
        socket: {
          tls: false  // Explicitly disable TLS for redis://
        }
      };
    }
  }

  // Local development fallback
  return {
    socket: {
      host: 'localhost',
      port: 6379
    }
  };
};

const client = redis.createClient(getRedisConfig());

let isRedisConnected = false;

client.on('error', (err) => {
  if (isRedisConnected) {
    console.log('❌ Redis Client Error:', err.message);
    isRedisConnected = false;
  }
});

client.on('connect', () => {
  console.log('🔌 Redis Connecting to Cloud...');
});

client.on('ready', () => {
  console.log('✅ Redis Cloud Connected Successfully');
  console.log('✅ Redis Ready for Caching');
  isRedisConnected = true;
});

const connectRedis = async () => {
  try {
    await client.connect();
    console.log('🎯 Redis Cloud initialization completed');
  } catch (err) {
    console.log('⚠️ Redis Cloud connection failed:', err.message);
    console.log('🚫 Running without Redis cache');
  }
};

// Cache middleware
const cache = (duration) => {
  return async (req, res, next) => {
    if (!isRedisConnected || !client.isOpen) {
      return next();
    }

    const key = '__express__' + req.originalUrl || req.url;

    try {
      const cachedBody = await client.get(key);
      if (cachedBody) {
        res.send(JSON.parse(cachedBody));
        return;
      } else {
        res.sendResponse = res.send;
        res.send = (body) => {
          if (client.isOpen) {
            client.setEx(key, duration, JSON.stringify(body));
          }
          res.sendResponse(body);
        };
        next();
      }
    } catch (err) {
      next();
    }
  };
};

module.exports = { connectRedis, cache, client };
