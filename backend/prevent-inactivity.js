// Redis Cloud Activity Generator to prevent inactivity deletion
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const redis = require('redis');

async function tryConnect(config, name) {
  console.log(`\n--- Attempting connection: ${name} ---`);
  
  const client = redis.createClient(config);

  client.on('error', (err) => {
    // Keep logs quiet unless connection fails
  });

  try {
    await client.connect();
    console.log(`✅ Connected successfully via ${name}!`);
    return client;
  } catch (err) {
    console.error(`❌ Connection failed via ${name}:`, err.message);
    try {
      await client.disconnect();
    } catch (e) {}
    return null;
  }
}

async function run() {
  console.log('=== REDIS INACTIVITY PREVENTION START ===');
  
  const host = process.env.REDIS_HOST;
  const port = parseInt(process.env.REDIS_PORT || '6379');
  const password = process.env.REDIS_PASSWORD;

  if (!host || !password) {
    console.error('❌ Error: REDIS_HOST and REDIS_PASSWORD environment variables are not set in .env');
    process.exit(1);
  }

  console.log(`Targeting Host: ${host}:${port}`);

  const configs = [
    // 1. TLS combinations
    {
      name: 'TLS (rediss://default:pwd@...)',
      config: {
        url: `rediss://default:${password}@${host}:${port}`,
        socket: { tls: true, rejectUnauthorized: false, reconnectStrategy: false }
      }
    },
    {
      name: 'TLS (rediss://:pwd@...)',
      config: {
        url: `rediss://:${password}@${host}:${port}`,
        socket: { tls: true, rejectUnauthorized: false, reconnectStrategy: false }
      }
    },
    {
      name: 'TLS (host/port/pwd object)',
      config: {
        socket: { host, port, tls: true, rejectUnauthorized: false, reconnectStrategy: false },
        password: password
      }
    },

    // 2. Non-TLS combinations
    {
      name: 'Plaintext (redis://default:pwd@...)',
      config: {
        url: `redis://default:${password}@${host}:${port}`,
        socket: { tls: false, reconnectStrategy: false }
      }
    },
    {
      name: 'Plaintext (redis://:pwd@...)',
      config: {
        url: `redis://:${password}@${host}:${port}`,
        socket: { tls: false, reconnectStrategy: false }
      }
    },
    {
      name: 'Plaintext (host/port/pwd object)',
      config: {
        socket: { host, port, tls: false, reconnectStrategy: false },
        password: password
      }
    }
  ];

  let client = null;
  for (const c of configs) {
    client = await tryConnect(c.config, c.name);
    if (client) {
      break;
    }
  }

  if (!client) {
    console.error('\n❌ Could not connect to Redis with any configuration combination.');
    process.exit(1);
  }

  try {
    console.log('\n--- Running Activity Commands ---');
    
    // Ping
    const pingResult = await client.ping();
    console.log(`PING Response: ${pingResult}`);

    // Set a key to prevent inactivity
    const key = 'rgbasket:inactivity_prevent_ping';
    const val = `Active at ${new Date().toISOString()}`;
    await client.set(key, val);
    console.log(`SET key [${key}] to: [${val}]`);

    // Get the key
    const retrievedVal = await client.get(key);
    console.log(`GET key [${key}] response: [${retrievedVal}]`);

    // View other keys in the database
    console.log('\nScanning for keys in the database...');
    const keys = await client.keys('*');
    console.log(`Found ${keys.length} key(s) in the database:`);
    keys.forEach((k, idx) => {
      console.log(`  ${idx + 1}. ${k}`);
    });

    console.log('\n✅ Redis database is active and data has been written successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error executing Redis commands:', err.message);
    process.exit(1);
  } finally {
    try {
      await client.quit();
      console.log('🔌 Redis client disconnected.');
    } catch (e) {}
  }
}

run();
