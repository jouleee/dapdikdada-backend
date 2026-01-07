require('dotenv').config();
const mongoose = require('mongoose');
const School = require('../models/School');
const connectDB = require('../config/database');

// Seeded random function - menggunakan NPSN sebagai seed
// Supaya sekolah yang sama selalu dapat akreditasi yang sama
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Convert NPSN string to number for seed
function npsnToSeed(npsn) {
  let hash = 0;
  for (let i = 0; i < npsn.length; i++) {
    hash = ((hash << 5) - hash) + npsn.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate akreditasi berdasarkan NPSN (seeded random)
function generateAkreditasi(npsn, jenjang) {
  const seed = npsnToSeed(npsn);
  const random = seededRandom(seed);
  
  // Distribusi akreditasi berdasarkan data Jawa Barat (Akhir 2023):
  // - 59% A
  // - 38% B
  // - 3% C
  // - 3% TT (Tidak Terakreditasi)
  
  if (random < 0.59) {
    return 'A';
  } else if (random < 0.97) {
    return 'B';
  } else if (random < 0.99) {
    return 'C';
  } else {
    return 'TT';
  }
}

const seedAkreditasi = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Mengambil data sekolah...');
    const schools = await School.find({});
    console.log(`📊 Total sekolah: ${schools.length}`);
    
    let updated = 0;
    let distribution = {
      A: 0,
      B: 0,
      C: 0,
      TT: 0
    };
    
    console.log('🎲 Generating akreditasi dengan seeded random...');
    
    // Update dalam batch untuk performa
    const bulkOps = schools.map(school => {
      const akreditasi = generateAkreditasi(school.npsn, school.jenjang);
      
      // Count distribution
      distribution[akreditasi]++;
      
      return {
        updateOne: {
          filter: { _id: school._id },
          update: { $set: { akreditasi: akreditasi } }
        }
      };
    });
    
    console.log('💾 Menyimpan akreditasi ke database...');
    const result = await School.bulkWrite(bulkOps);
    updated = result.modifiedCount;
    
    console.log('\n✅ Seeding akreditasi selesai!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Total sekolah diupdate: ${updated}`);
    console.log('\n📊 Distribusi Akreditasi:');
    console.log(`   Akreditasi A:              ${distribution.A.toLocaleString('id-ID')} sekolah (${((distribution.A / schools.length) * 100).toFixed(1)}%)`);
    console.log(`   Akreditasi B:              ${distribution.B.toLocaleString('id-ID')} sekolah (${((distribution.B / schools.length) * 100).toFixed(1)}%)`);
    console.log(`   Akreditasi C:              ${distribution.C.toLocaleString('id-ID')} sekolah (${((distribution.C / schools.length) * 100).toFixed(1)}%)`);
    console.log(`   Tidak Terakreditasi (TT):  ${distribution.TT.toLocaleString('id-ID')} sekolah (${((distribution.TT / schools.length) * 100).toFixed(1)}%)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Catatan: Akreditasi di-generate dengan seeded random berdasarkan NPSN');
    console.log('   Setiap sekolah akan selalu mendapat akreditasi yang sama (konsisten)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding akreditasi:', error);
    process.exit(1);
  }
};

seedAkreditasi();
