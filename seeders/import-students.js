const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const csv = require('csv-parser');
const mongoose = require('mongoose');
const StudentStatistic = require('../models/Student');
const connectDB = require('../config/database');

// Data CSV files untuk jumlah siswa per jenjang
const CSV_FILES = {
  SD: 'jlm_siswa_sd.csv',
  SMP: 'jml_siswa_smp.csv',
  SMA: 'jlm_siswa_sma.csv',
  SMK: 'jlm_siswa_smk.csv',
  SLB: 'jml_siswa_slb.csv'
};

// Parse CSV dan import ke database
async function importStudentStatistics(jenjang, filename) {
  const filePath = path.join(__dirname, '..', 'data', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File ${filename} tidak ditemukan, skip.`);
    return 0;
  }

  const records = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Normalisasi nama kolom karena berbeda antar file
        const statusSekolah = row.status_sekolah || row.kategori_sekolah || 'NEGERI';
        const jumlahSiswa = parseInt(row.jumlah_siswa || row.jumlah_murid || 0);
        
        // Skip invalid records
        if (!row.nama_kabupaten_kota || jumlahSiswa < 0) {
          return;
        }
        
        records.push({
          kode_provinsi: row.kode_provinsi || '',
          nama_provinsi: row.nama_provinsi || 'JAWA BARAT',
          kode_kabupaten_kota: row.kode_kabupaten_kota || '',
          nama_kabupaten_kota: row.nama_kabupaten_kota,
          jenjang: jenjang,
          status_sekolah: statusSekolah.toUpperCase(),
          jumlah_siswa: jumlahSiswa,
          tahun_ajaran: row.tahun_ajaran || '2023/2024'
        });
      })
      .on('end', async () => {
        console.log(`\n📚 Reading ${filename}...`);
        console.log(`📊 Found ${records.length} records for ${jenjang}`);
        
        try {
          // Import dengan batch untuk performa
          const batchSize = 1000;
          let imported = 0;
          let actualInserted = 0;
          
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            try {
              const result = await StudentStatistic.insertMany(batch, { ordered: false });
              actualInserted += result.length;
              imported += batch.length;
              console.log(`   ✓ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${result.length}/${batch.length} (${actualInserted}/${records.length} total)`);
            } catch (err) {
              if (err.code === 11000) {
                const successCount = batch.length - (err.writeErrors?.length || 0);
                actualInserted += successCount;
                imported += batch.length;
                console.log(`   ⚠️  Batch ${Math.floor(i / batchSize) + 1}: ${successCount} inserted, ${err.writeErrors?.length || 0} duplicates`);
              } else {
                throw err;
              }
            }
          }
          
          console.log(`✅ ${jenjang}: ${actualInserted}/${records.length} records inserted successfully!\n`);
          resolve(actualInserted);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Main seeder function
async function seedStudentStatistics() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB Connected');
    
    // Clear existing data
    console.log('🗑️  Clearing existing student statistics data...\n');
    await StudentStatistic.deleteMany({});
    
    let totalImported = 0;
    
    // Import data untuk setiap jenjang
    for (const [jenjang, filename] of Object.entries(CSV_FILES)) {
      const count = await importStudentStatistics(jenjang, filename);
      totalImported += count;
    }
    
    console.log(`🎉 Total ${totalImported} student statistics imported!`);
    
    // Show statistics
    const stats = await StudentStatistic.aggregate([
      {
        $group: {
          _id: '$jenjang',
          total_records: { $sum: 1 },
          total_siswa: { $sum: '$jumlah_siswa' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 Import Statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.total_records} records, ${stat.total_siswa.toLocaleString()} siswa`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Destroy data function
async function destroyStudentStatistics() {
  try {
    await connectDB();
    console.log('MongoDB Connected');
    
    await StudentStatistic.deleteMany({});
    console.log('✅ All student statistics data deleted!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run based on command line argument
if (process.argv[2] === '-d' || process.argv[2] === '--destroy') {
  destroyStudentStatistics();
} else {
  seedStudentStatistics();
}
