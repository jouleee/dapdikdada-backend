require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const connectDB = require('../config/database');

// Connect to MongoDB
connectDB();

const seedAdmins = async () => {
  try {
    // Delete existing admins
    await Admin.deleteMany({});
    console.log('🗑️  Existing admins deleted');

    // Create default admins
    const admins = [
      {
        name: 'Super Admin',
        email: 'superadmin@dapdik.com',
        password: 'admin123',
        role: 'superadmin',
        isActive: true,
      },
      {
        name: 'Admin Pendidikan',
        email: 'admin@dapdik.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      },
    ];

    await Admin.insertMany(admins);
    console.log('✅ Default admins created successfully!');
    console.log('\n📧 Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Email: superadmin@dapdik.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Admin:');
    console.log('  Email: admin@dapdik.com');
    console.log('  Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admins:', error);
    process.exit(1);
  }
};

seedAdmins();
