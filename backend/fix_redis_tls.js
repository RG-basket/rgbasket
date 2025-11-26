const fs = require('fs');
const path = require('path');

// Read the redis.js file
const filePath = path.join(__dirname, 'services', 'redis.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the TLS configuration section
const oldTLSConfig = `    if (needsTLS) {
      config.socket.tls = true;
      config.socket.rejectUnauthorized = false;
      console.log('🔒 TLS enabled for Redis Cloud connection');
    }`;

const newTLSConfig = `    if (needsTLS) {
      config.socket.tls = true;
      config.socket.rejectUnauthorized = false;
      // Add servername for proper SSL handshake (fixes ERR_SSL_WRONG_VERSION_NUMBER)
      config.socket.servername = process.env.REDIS_HOST;
      console.log('🔒 TLS enabled for Redis Cloud connection');
    }`;

content = content.replace(oldTLSConfig, newTLSConfig);

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Successfully updated redis.js with servername fix');
