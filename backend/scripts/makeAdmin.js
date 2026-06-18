/**
 * Administrative User Promotion Script
 * Usage: node makeAdmin.js <email>
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const email = process.argv[2];

if (!email) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: Please provide an email address.');
  console.log('Usage: node makeAdmin.js <email>');
  process.exit(1);
}

const dbUri = process.env.MONGODB_URI;

if (!dbUri) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: MONGODB_URI is not defined in your backend/.env file.');
  process.exit(1);
}

console.log(`⏳ Connecting to MongoDB at ${dbUri}...`);

mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('✅ Connected to MongoDB.');
    console.log(`⏳ Searching for user with email: ${email}...`);

    const user = await User.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });

    if (!user) {
      console.error('\x1b[31m%s\x1b[0m', `❌ Error: User with email "${email}" not found in the database.`);
      console.log('Make sure the user has logged in via Google Auth at least once.');
      mongoose.connection.close();
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`ℹ️ User "${user.name}" (${user.email}) is already an administrator.`);
      mongoose.connection.close();
      process.exit(0);
    }

    console.log(`⏳ Promoting user: "${user.name}" (${user.email})...`);
    user.role = 'admin';
    await user.save();

    console.log('\x1b[32m%s\x1b[0m', `🎉 Success: User "${user.name}" (${user.email}) has been successfully promoted to "admin"!`);
    
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('\x1b[31m%s\x1b[0m', '❌ MongoDB connection error:', err);
    process.exit(1);
  });
