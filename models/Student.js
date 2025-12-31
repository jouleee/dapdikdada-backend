const mongoose = require('mongoose');

// Model untuk statistik jumlah siswa per kabupaten/jenjang/status/tahun
const studentStatisticSchema = new mongoose.Schema({
  kode_provinsi: {
    type: String,
    required: true,
    trim: true
  },
  nama_provinsi: {
    type: String,
    required: true,
    trim: true
  },
  kode_kabupaten_kota: {
    type: String,
    required: true,
    trim: true
  },
  nama_kabupaten_kota: {
    type: String,
    required: true,
    trim: true
  },
  jenjang: {
    type: String,
    required: true,
    enum: ['SD', 'SMP', 'SMA', 'SMK', 'SLB']
  },
  status_sekolah: {
    type: String,
    required: true,
    enum: ['NEGERI', 'SWASTA']
  },
  jumlah_siswa: {
    type: Number,
    required: true,
    min: 0
  },
  tahun_ajaran: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Index untuk query yang sering digunakan
studentStatisticSchema.index({ kode_kabupaten_kota: 1 });
studentStatisticSchema.index({ nama_kabupaten_kota: 1 });
studentStatisticSchema.index({ jenjang: 1 });
studentStatisticSchema.index({ status_sekolah: 1 });
studentStatisticSchema.index({ tahun_ajaran: 1 });
studentStatisticSchema.index({ jenjang: 1, status_sekolah: 1, tahun_ajaran: 1 });

module.exports = mongoose.model('StudentStatistic', studentStatisticSchema);
