const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');

const School = require('../models/School');
const Student = require('../models/Student');
const EducationProgram = require('../models/EducationProgram');

const resetDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB Connected\n');

    // Drop all collections
    console.log('🗑️  Dropping all collections...\n');
    
    try {
      await School.collection.drop();
      console.log('  ✓ Schools collection dropped');
    } catch (err) {
      console.log('  ℹ Schools collection does not exist');
    }
    
    try {
      await Student.collection.drop();
      console.log('  ✓ Student statistics collection dropped');
    } catch (err) {
      console.log('  ℹ Student statistics collection does not exist');
    }
    
    try {
      await EducationProgram.collection.drop();
      console.log('  ✓ Education programs collection dropped');
    } catch (err) {
      console.log('  ℹ Education programs collection does not exist');
    }

    // Recreate indexes
    console.log('\n📋 Recreating indexes...');
    await School.createIndexes();
    await Student.createIndexes();
    await EducationProgram.createIndexes();
    console.log('  ✓ All indexes created\n');

    console.log('✅ Database reset successfully!\n');
    console.log('Run these commands to seed data:');
    console.log('  npm run seed:schools');
    console.log('  npm run seed:students\n');
    console.log('Or run: npm run db:fresh (to reset + seed all)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();
