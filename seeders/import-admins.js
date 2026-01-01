const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Admin = require('../models/Admin');

const admins = [
  {
    name: 'Super Admin',
    email: 'superadmin@jabar.go.id',
    password: 'admin123',
    role: 'superadmin'
  },
  {
    name: 'Admin Jabar',
    email: 'admin@jabar.go.id',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Admin Kota Bandung',
    email: 'admin.bandung@jabar.go.id',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Admin Kabupaten Bandung',
    email: 'admin.kabbandung@jabar.go.id',
    password: 'admin123',
    role: 'admin'
  }
];

const importData = async () => {
  try {
    // Verify MONGODB_URI
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI not found in .env file');
    }

    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Clear existing admins
    console.log('🗑️  Clearing existing admin data...');
    await Admin.deleteMany();
    console.log('✅ Existing admin data cleared\n');

    // Import admins
    console.log('📥 Importing admin accounts...\n');
    
    for (const adminData of admins) {
      const admin = await Admin.create(adminData);
      console.log(`   ✓ Created: ${admin.name} (${admin.email}) - Role: ${admin.role}`);
    }

    console.log(`\n🎉 Total ${admins.length} admin accounts imported!`);
    console.log('\n📋 Default Login Credentials:');
    console.log('   Email: superadmin@jabar.go.id');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change default passwords after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing admins:', error.message);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI not found in .env file');
    }

    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Deleting all admin accounts...');
    const result = await Admin.deleteMany();
    console.log(`✅ ${result.deletedCount} admin accounts deleted!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error destroying admins:', error.message);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '-d' || process.argv[2] === 'destroy') {
  destroyData();
} else {
  importData();
}
