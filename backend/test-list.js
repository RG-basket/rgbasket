const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const dbUri = process.env.MONGODB_URI;

if (!dbUri) {
  console.error('❌ MONGODB_URI not found in env.');
  process.exit(1);
}

mongoose.connect(dbUri)
  .then(async () => {
    const users = await User.find({}).select('name email role');
    console.log('📋 Registered Users:');
    users.forEach(u => console.log(`- Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`));
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
