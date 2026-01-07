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

    // Create admins satu per satu agar password ter-hash
    console.log('📥 Creating admin accounts...\n');
    for (const adminData of admins) {
      const admin = await Admin.create(adminData);
      console.log(`   ✓ Created: ${admin.name} (${admin.email}) - Role: ${admin.role}`);
    }

    console.log('\n✅ Default admins created successfully!');
    console.log('\n📧 Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Email: superadmin@dapdik.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Admin:');
    console.log('  Email: admin@dapdik.com');
    console.log('  Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔒 Passwords are automatically hashed with bcrypt\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admins:', error);
    process.exit(1);
  }
};

seedAdmins();
