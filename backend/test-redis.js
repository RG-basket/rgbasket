// Quick Redis connection test
require('dotenv').config();
const redis = require('redis');

console.log('\n=== REDIS CONNECTION TEST ===\n');

console.log('Environment Variables:');
console.log('REDIS_URL:', process.env.REDIS_URL ? 'SET (length: ' + process.env.REDIS_URL.length + ')' : 'NOT SET');
console.log('REDIS_HOST:', process.env.REDIS_HOST || 'NOT SET');
console.log('REDIS_PORT:', process.env.REDIS_PORT || 'NOT SET');
console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? 'SET (length: ' + process.env.REDIS_PASSWORD.length + ')' : 'NOT SET');

// Import the actual config function
const { getRedisConfig } = require('./services/redis');

console.log('\n--- Attempting Redis Connection ---\n');

const config = {
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        tls: true,
        rejectUnauthorized: false
    },
    password: process.env.REDIS_PASSWORD
};

console.log('Connection Config:', {
    host: config.socket.host,
    port: config.socket.port,
    tls: config.socket.tls,
    hasPassword: !!config.password
});

const client = redis.createClient(config);

client.on('error', (err) => {
    console.error('\n❌ Redis Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
});

client.on('connect', () => {
    console.log('\n🔌 Redis Connecting...');
});

client.on('ready', () => {
    console.log('\n✅ Redis Connected Successfully!');
    console.log('✅ Redis is ready for caching\n');
    client.quit();
    process.exit(0);
});

client.connect().catch(err => {
    console.error('\n❌ Connection failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
});

setTimeout(() => {
    console.error('\n⏱️ Connection timeout after 10 seconds');
    process.exit(1);
}, 10000);
