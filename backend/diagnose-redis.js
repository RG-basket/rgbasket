// Redis connection diagnostic and fix
require('dotenv').config();
const redis = require('redis');

console.log('\n=== REDIS LABS CONNECTION FIX ===\n');

// Show what we have
console.log('Current REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');

if (!process.env.REDIS_URL || process.env.REDIS_URL.trim() === '') {
    console.log('\n❌ REDIS_URL is empty or not set!');
    console.log('\nPlease set REDIS_URL in your .env file like this:');
    console.log('REDIS_URL=rediss://default:YOUR_PASSWORD@redis-10507.crce217.ap-south-1-1.ec2.cloud.redislabs.com:10507');
    process.exit(1);
}

// Try to connect with the URL
console.log('\nAttempting connection with REDIS_URL...\n');

const client = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: true,
        rejectUnauthorized: false,
        reconnectStrategy: false // Disable auto-reconnect for testing
    }
});

client.on('error', (err) => {
    console.error('\n❌ Connection Error:', err.message);
    console.error('\nPossible issues:');
    console.error('1. Wrong password in REDIS_URL');
    console.error('2. Redis Labs instance is not active');
    console.error('3. IP address is blocked (check Redis Labs dashboard)');
    console.error('4. Malformed REDIS_URL');
    console.error('\nYour REDIS_URL should look like:');
    console.error('rediss://default:PASSWORD@HOST:PORT');
    process.exit(1);
});

client.on('connect', () => {
    console.log('🔌 Connecting to Redis Labs...');
});

client.on('ready', () => {
    console.log('\n✅ SUCCESS! Redis Labs connected!\n');
    console.log('Your Redis caching is now working correctly.');
    console.log('The server will use this connection for caching.\n');
    client.quit();
    process.exit(0);
});

client.connect().catch(err => {
    console.error('\n❌ Failed to connect:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('\n⏱️ Connection timeout - check your Redis Labs instance');
    process.exit(1);
}, 10000);
