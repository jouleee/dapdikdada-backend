const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const csv = require('csv-parser');
const mongoose = require('mongoose');
const School = require('../models/School');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const importSchoolsFromCSV = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing school data...');
    await School.deleteMany();

    const dataFolder = path.join(__dirname, '..', 'data');
    const csvFiles = {
      SD: 'daftar_nama_sd.csv',
      SMP: 'daftar_nama_smp.csv',
      SMA: 'daftar_nama_sma.csv',
      SMK: 'daftar_nama_smk.csv',
      SLB: 'daftar_nama_slb.csv'
    };

    let totalImported = 0;

    for (const [jenjang, fileName] of Object.entries(csvFiles)) {
      const filePath = path.join(dataFolder, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File ${fileName} tidak ditemukan, skip...`);
        continue;
      }

      console.log(`\n📖 Reading ${fileName}...`);
      const data = await readCSV(filePath);
      
      console.log(`📊 Found ${data.length} records for ${jenjang}`);

      const schools = data.map(row => ({
        nama_sekolah: row.nama_sekolah,
        npsn: row.npsn,
        jenjang: jenjang,
        status_sekolah: row.status_sekolah?.toUpperCase() || 'SWASTA',
        alamat_sekolah: row.alamat_sekolah,
        kode_provinsi: row.kode_provinsi,
        nama_provinsi: row.nama_provinsi,
        kode_kabupaten_kota: row.kode_kabupaten_kota,
        nama_kabupaten_kota: row.nama_kabupaten_kota,
        bps_kode_kecamatan: row.bps_kode_kecamatan,
        bps_nama_kecamatan: row.bps_nama_kecamatan,
        kemendagri_kode_kecamatan: row.kemendagri_kode_kecamatan,
        kemendagri_nama_kecamatan: row.kemendagri_nama_kecamatan,
        tahun: parseInt(row.tahun) || 2023,
        jumlah_siswa: 0,
        akreditasi: 'Belum Terakreditasi'
      }));

      // Insert in batches to avoid memory issues
      const batchSize = 1000;
      for (let i = 0; i < schools.length; i += batchSize) {
        const batch = schools.slice(i, i + batchSize);
        await School.insertMany(batch, { ordered: false }).catch(err => {
          // Ignore duplicate key errors
          if (err.code !== 11000) throw err;
        });
        console.log(`   ✓ Imported ${Math.min(i + batchSize, schools.length)}/${schools.length}`);
      }

      totalImported += schools.length;
      console.log(`✅ ${jenjang} imported successfully!`);
    }

    console.log(`\n🎉 Total ${totalImported} schools imported!`);
    
    // Show statistics
    const stats = await School.aggregate([
      {
        $group: {
          _id: '$jenjang',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Import Statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} schools`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await School.deleteMany();
    console.log('✅ All school data destroyed!');
    process.exit(0);
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importSchoolsFromCSV();
}
