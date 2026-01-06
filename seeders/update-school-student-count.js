require('dotenv').config();
const mongoose = require('mongoose');
const School = require('../models/School');
const StudentStatistic = require('../models/Student');
const connectDB = require('../config/database');

// Update jumlah siswa di School berdasarkan StudentStatistic
async function updateSchoolStudentCount() {
  try {
    await connectDB();
    console.log('🔍 Mengambil data sekolah dan statistik siswa...\n');

    const schools = await School.find({});
    console.log(`📊 Total sekolah: ${schools.length}\n`);

    let updated = 0;
    let skipped = 0;

    for (const school of schools) {
      try {
        // Cari statistik siswa yang sesuai dengan sekolah
        // Kriteria: jenjang, status_sekolah, nama_kabupaten_kota, tahun
        const studentStats = await StudentStatistic.findOne({
          jenjang: school.jenjang,
          status_sekolah: school.status_sekolah,
          nama_kabupaten_kota: school.nama_kabupaten_kota,
          tahun_ajaran: { $exists: true } // Ambil yang paling recent
        }).sort({ tahun_ajaran: -1 }); // Urutkan dari tahun terbaru

        if (studentStats) {
          // Update jumlah_siswa dengan data dari statistik
          school.jumlah_siswa = studentStats.jumlah_siswa;
          await school.save();
          updated++;

          console.log(
            `✅ ${school.nama_sekolah} (${school.npsn}) - ${studentStats.jumlah_siswa} siswa`
          );
        } else {
          skipped++;
          console.log(
            `⏭️  ${school.nama_sekolah} (${school.npsn}) - data statistik tidak ditemukan`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error updating ${school.nama_sekolah}:`,
          error.message
        );
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📊 Total: ${schools.length}\n`);

    // Verify hasil
    const updatedSchools = await School.find({ jumlah_siswa: { $gt: 0 } });
    console.log(
      `🎉 Sekolah dengan data siswa: ${updatedSchools.length}/${schools.length}`
    );

    // Show sample data
    const samples = await School.find({ jumlah_siswa: { $gt: 0 } })
      .limit(5)
      .sort({ jumlah_siswa: -1 });

    if (samples.length > 0) {
      console.log('\n📋 Sample data (Top 5 schools by student count):');
      samples.forEach((s) => {
        console.log(
          `   - ${s.nama_sekolah}: ${s.jumlah_siswa.toLocaleString()} siswa`
        );
      });
    }

    await mongoose.connection.close();
    console.log('\n✨ Seeding selesai!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateSchoolStudentCount();
