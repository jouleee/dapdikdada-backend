require('dotenv').config();
const mongoose = require('mongoose');
const School = require('../models/School');
const StudentStatistic = require('../models/Student');
const connectDB = require('../config/database');

const TARGET_YEAR = '2024/2025';

// Aturan per jenjang (min dinamis per sekolah, max dengan sedikit jitter agar tidak "pas banget")
const JENJANG_RULES = {
  SD: { minRange: [90, 168], max: 1200, softMaxJitter: [0, 5] },
  SMP: { minRange: [96, 172], max: 1500, softMaxJitter: [0, 5] },
  SMA: { minRange: [108, 176], max: 1700, softMaxJitter: [0, 5] },
  SMK: { minRange: [108, 176], max: 1700, softMaxJitter: [0, 5] },
  SLB: { minRange: [40, 40], max: 213, softMaxJitter: [0, 3] }
};

function getRules(jenjang) {
  return JENJANG_RULES[jenjang] || { minRange: [0, 0], max: 2000, softMaxJitter: [0, 0] };
}

// Bagi total siswa per (kabupaten, jenjang, status) ke sekolah-sekolah di grup itu
function distributeStudents(total, schoolsInGroup) {
  const n = schoolsInGroup.length;
  if (n === 0 || total <= 0) return new Array(n).fill(0);

  // Random weight 0.7–1.3 supaya tetap logis tapi variatif
  const weights = schoolsInGroup.map(() => 0.7 + Math.random() * 0.6);
  const sumWeights = weights.reduce((a, b) => a + b, 0);

  let allocations = new Array(n).fill(0);
  let remaining = total;

  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      allocations[i] = Math.max(0, remaining);
    } else {
      const val = Math.max(0, Math.round((total * weights[i]) / sumWeights));
      allocations[i] = val;
      remaining -= val;
    }
  }

  // Jika karena pembulatan total jadi meleset, koreksi ke sekolah terakhir
  const diff = total - allocations.reduce((a, b) => a + b, 0);
  allocations[n - 1] = Math.max(0, allocations[n - 1] + diff);

  // Terapkan batas per-jenjang (min dinamis per sekolah, max dengan jitter)
  const { minRange, max, softMaxJitter } = getRules(schoolsInGroup[0].jenjang);
  const [absMinLow, absMinHigh] = minRange;
  const jitterMax = softMaxJitter[1] || 0;

  // Tentukan min_i dan max_i per sekolah
  const mins = schoolsInGroup.map(() => {
    if (absMinLow === absMinHigh) return absMinLow;
    return absMinLow + Math.floor(Math.random() * (absMinHigh - absMinLow + 1));
  });
  const maxs = schoolsInGroup.map(() => max + Math.floor(Math.random() * (jitterMax + 1)));

  // Tahap 1: naikkan ke min_i
  allocations = allocations.map((v, i) => Math.max(mins[i], v));

  let sumAlloc = allocations.reduce((a, b) => a + b, 0);

  // Jika kebesaran dibanding total, turunkan proporsional tapi tidak kurang dari min
  if (sumAlloc > total) {
    const reducible = allocations.map((v, i) => v - mins[i]);
    const reducibleSum = reducible.reduce((a, b) => a + b, 0);
    if (reducibleSum > 0) {
      const excess = sumAlloc - total;
      allocations = allocations.map((v, i) => {
        const r = reducible[i];
        const cut = Math.round((r / reducibleSum) * excess);
        return Math.max(mins[i], v - cut);
      });
    }
  }

  // Jika tetap kebesaran (karena jumlah min_i > total), turunkan sebagian min_i mendekati absMinLow
  sumAlloc = allocations.reduce((a, b) => a + b, 0);
  if (sumAlloc > total) {
    let over = sumAlloc - total;
    // coba kurangi dari sekolah yang min-nya lebih tinggi dulu
    const idxs = [...Array(n).keys()].sort((a, b) => mins[b] - mins[a]);
    for (const i of idxs) {
      if (over <= 0) break;
      const canReduceMin = mins[i] - absMinLow;
      if (canReduceMin > 0) {
        const take = Math.min(canReduceMin, over);
        mins[i] -= take;
        allocations[i] -= take;
        over -= take;
      }
    }
    // Jika masih over, terpaksa kurangi di bawah absMinLow hingga nol (kasus ekstrem)
    if (over > 0) {
      for (let i = 0; i < n && over > 0; i++) {
        const canReduce = Math.min(allocations[i], over);
        allocations[i] -= canReduce;
        over -= canReduce;
      }
    }
  }

  // Tahap 2: jika masih ada sisa, distribusikan ke atas tapi tidak melewati max
  sumAlloc = allocations.reduce((a, b) => a + b, 0);
  if (sumAlloc < total) {
    let remainingAdd = total - sumAlloc;
    const room = allocations.map((v, i) => Math.max(0, maxs[i] - v));
    let roomSum = room.reduce((a, b) => a + b, 0);

    if (roomSum > 0) {
      allocations = allocations.map((v, i) => {
        if (remainingAdd <= 0) return v;
        const add = Math.min(maxs[i] - v, Math.round((room[i] / roomSum) * remainingAdd));
        remainingAdd -= add;
        return v + add;
      });
    }

    // Jika masih ada sisa karena pembulatan, tambahkan ke entri yang belum max
    if (remainingAdd > 0) {
      for (let i = 0; i < n && remainingAdd > 0; i++) {
        const space = Math.max(0, maxs[i] - allocations[i]);
        const add = Math.min(space, remainingAdd);
        allocations[i] += add;
        remainingAdd -= add;
      }
    }
  }

  // Koreksi akhir supaya total pas (jika sedikit meleset karena pembulatan)
  const finalSum = allocations.reduce((a, b) => a + b, 0);
  const finalDiff = total - finalSum;
  if (finalDiff !== 0 && n > 0) {
    const idx = allocations.findIndex((v, i) => v > mins[i] && v < maxs[i]);
    const targetIdx = idx >= 0 ? idx : n - 1;
    allocations[targetIdx] = Math.min(maxs[targetIdx], Math.max(mins[targetIdx], allocations[targetIdx] + finalDiff));
  }

  // Pastikan tetap dalam batas setelah koreksi
  allocations = allocations.map((v, i) => Math.min(maxs[i], Math.max(mins[i], v)));

  // Hindari angka "pas banget" di batas max dasar (1200/1500/1700) bila memungkinkan
  for (let i = 0; i < n; i++) {
    const baseMax = max;
    if (allocations[i] === baseMax) {
      // coba geser 1 ke sekolah lain yang masih di bawah max-nya
      const j = allocations.findIndex((val, k) => k !== i && val < maxs[k]);
      if (j !== -1 && allocations[i] > mins[i]) {
        allocations[i] -= 1;
        allocations[j] += 1;
      } else if (allocations[i] < maxs[i]) {
        allocations[i] += 1; // sedikit di atas batas dasar, sesuai permintaan "boleh lebih dikit"
      }
    }
  }

  // Jika semua kebetulan sama, jitter sedikit agar variatif (tanpa ubah total)
  const unique = new Set(allocations).size;
  if (unique === 1 && n > 1) {
    // geser +1, -1 secara berpasangan sepanjang tidak melanggar batas
    for (let i = 0; i + 1 < n; i += 2) {
      if (allocations[i + 1] - 1 >= mins[i + 1] && allocations[i] + 1 <= maxs[i]) {
        allocations[i] += 1;
        allocations[i + 1] -= 1;
      }
    }
  }

  return allocations;
}

// Update jumlah siswa di School berdasarkan statistik tahun ajaran TARGET_YEAR
async function updateSchoolStudentCount() {
  try {
    await connectDB();
    console.log('🔍 Mengambil data sekolah dan statistik siswa (tahun 2024/2025)...\n');

    const schools = await School.find({});
    console.log(`📊 Total sekolah: ${schools.length}\n`);

    // Ambil total siswa per (kabupaten, jenjang, status) untuk tahun target
    const stats = await StudentStatistic.aggregate([
      { $match: { tahun_ajaran: TARGET_YEAR } },
      {
        $group: {
          _id: {
            jenjang: '$jenjang',
            status_sekolah: '$status_sekolah',
            nama_kabupaten_kota: '$nama_kabupaten_kota'
          },
          total_siswa: { $sum: '$jumlah_siswa' }
        }
      }
    ]);

    const statMap = new Map();
    stats.forEach((stat) => {
      const key = `${stat._id.jenjang}|${stat._id.status_sekolah}|${stat._id.nama_kabupaten_kota}`;
      statMap.set(key, stat.total_siswa);
    });

    // Kelompokkan sekolah per (kabupaten, jenjang, status)
    const groups = new Map();
    for (const school of schools) {
      const key = `${school.jenjang}|${school.status_sekolah}|${school.nama_kabupaten_kota}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(school);
    }

    let updated = 0;
    let skipped = 0;
    const bulkOps = [];

    for (const [key, schoolList] of groups.entries()) {
      const total = statMap.get(key);
      if (!total) {
        skipped += schoolList.length;
        continue;
      }

      const allocations = distributeStudents(total, schoolList);
      schoolList.forEach((school, idx) => {
        bulkOps.push({
          updateOne: {
            filter: { _id: school._id },
            update: { $set: { jumlah_siswa: allocations[idx] } }
          }
        });
      });
      updated += schoolList.length;
    }

    if (bulkOps.length) {
      await School.bulkWrite(bulkOps, { ordered: false });
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (tanpa data tahun 2024/2025): ${skipped}`);
    console.log(`   📊 Total: ${schools.length}\n`);

    // Verify hasil
    const updatedSchools = await School.countDocuments({ jumlah_siswa: { $gt: 0 } });
    console.log(
      `🎉 Sekolah dengan data siswa terisi: ${updatedSchools}/${schools.length}`
    );

    const samples = await School.find({ jumlah_siswa: { $gt: 0 } })
      .limit(5)
      .sort({ jumlah_siswa: -1 });

    if (samples.length > 0) {
      console.log('\n📋 Sample data (Top 5 jumlah siswa):');
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
