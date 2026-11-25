// run once with: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Facility = require('./models/Facility');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // admin account
  const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!adminExists) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL,
      password: hashed,
      role: 'admin',
    });
    console.log('Admin created');
  }

  // sample facilities around Pune - replace these with real places
  const count = await Facility.countDocuments();
  if (count === 0) {
    await Facility.insertMany([
      { name: 'Sample Recycling Centre', type: 'recycling centre', lat: 18.5204, lng: 73.8567, contact: '0000000000' },
      { name: 'Sample Scrap Shop', type: 'scrap shop', lat: 18.5314, lng: 73.8446, contact: '0000000000' },
      { name: 'Sample Waste-to-Energy Plant', type: 'waste-to-energy plant', lat: 18.5018, lng: 73.8636, contact: '0000000000' },
    ]);
    console.log('Facilities added');
  }

  await mongoose.disconnect();
  console.log('Seeding done');
}

seed().catch((err) => {
  console.log(err.message);
  process.exit(1);
});
