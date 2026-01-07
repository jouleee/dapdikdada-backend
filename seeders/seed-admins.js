require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const School = require('../models/School');
const connectDB = require('../config/database');

// Connect to MongoDB
connectDB();

const seedAdmins = async () => {
  try {
    // Delete existing admins
    await Admin.deleteMany({});
    console.log('🗑️  Existing admins deleted');

    // Create superadmin (tidak perlu school mapping)
    console.log('📥 Creating superadmin...');
    const superadmin = await Admin.create({
      name: 'Super Admin',
      email: 'superadmin@dapdik.com',
      password: 'admin123',
      role: 'superadmin',
      phone: '081234567890',
      isActive: true,
    });
    console.log(`   ✓ Superadmin: ${superadmin.email}`);

    // Ambil beberapa sekolah untuk mapping ke admin
    console.log('\n📥 Fetching schools for admin mapping...');
    const schools = await School.find().limit(5);
    
    if (schools.length === 0) {
      console.log('⚠️  No schools found. Please run school seeders first.');
      console.log('   Run: npm run seed:schools');
      process.exit(0);
    }

    // Create admin operators dengan school mapping
    console.log(`\n📥 Creating ${Math.min(3, schools.length)} admin operators...\n`);
    
    const adminData = [];
    
    if (schools[0]) {
      adminData.push({
        name: `Admin ${schools[0].nama_sekolah}`,
        email: `admin.${schools[0].npsn}@dapdik.com`,
        password: 'admin123',
        role: 'admin',
        npsn: schools[0].npsn,
        school_id: schools[0]._id,
        phone: '081234567891',
        isActive: true
      });
    }
    
    if (schools[1]) {
      adminData.push({
        name: `Admin ${schools[1].nama_sekolah}`,
        email: `admin.${schools[1].npsn}@dapdik.com`,
        password: 'admin123',
        role: 'admin',
        npsn: schools[1].npsn,
        school_id: schools[1]._id,
        phone: '081234567892',
        isActive: true
      });
    }
    
    if (schools[2]) {
      adminData.push({
        name: `Admin ${schools[2].nama_sekolah}`,
        email: `admin.${schools[2].npsn}@dapdik.com`,
        password: 'admin123',
        role: 'admin',
        npsn: schools[2].npsn,
        school_id: schools[2]._id,
        phone: '081234567893',
        isActive: true
      });
    }

    for (let i = 0; i < adminData.length; i++) {
      const admin = await Admin.create(adminData[i]);
      const school = await School.findById(admin.school_id);
      console.log(`   ✓ Admin: ${admin.email}`);
      console.log(`     School: ${school.nama_sekolah} (${admin.npsn})`);
    }

    console.log('\n✅ Admin seeding completed!');
    console.log('\n📧 Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Superadmin:');
    console.log('  Email: superadmin@dapdik.com');
    console.log('  Password: admin123');
    console.log('\nAdmin Operators:');
    for (let i = 0; i < adminData.length; i++) {
      const school = schools[i];
      console.log(`  ${i + 1}. Email: ${adminData[i].email}`);
      console.log(`     Password: admin123`);
      console.log(`     School: ${school.nama_sekolah} (${school.npsn})`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔒 Passwords are automatically hashed with bcrypt\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admins:', error);
    process.exit(1);
  }
};

seedAdmins();
