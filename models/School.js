const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  nama_sekolah: {
    type: String,
    required: [true, 'Nama sekolah harus diisi'],
    trim: true
  },
  npsn: {
    type: String,
    required: [true, 'NPSN harus diisi'],
    unique: true,
    trim: true
  },
  jenjang: {
    type: String,
    required: [true, 'Jenjang harus diisi'],
    enum: ['SD', 'SMP', 'SMA', 'SMK', 'SLB'],
  },
  status_sekolah: {
    type: String,
    required: [true, 'Status sekolah harus diisi'],
    enum: ['NEGERI', 'SWASTA'],
  },
  alamat_sekolah: {
    type: String,
    required: [true, 'Alamat harus diisi'],
    trim: true
  },
  kode_provinsi: {
    type: String,
    trim: true
  },
  nama_provinsi: {
    type: String,
    trim: true
  },
  kode_kabupaten_kota: {
    type: String,
    trim: true
  },
  nama_kabupaten_kota: {
    type: String,
    trim: true
  },
  bps_kode_kecamatan: {
    type: String,
    trim: true
  },
  bps_nama_kecamatan: {
    type: String,
    trim: true
  },
  kemendagri_kode_kecamatan: {
    type: String,
    trim: true
  },
  kemendagri_nama_kecamatan: {
    type: String,
    trim: true
  },
  tahun: {
    type: Number,
    default: 2023
  },
  // Fields tambahan untuk sistem
  jumlah_siswa: {
    type: Number,
    default: 0,
    min: 0
  },
  akreditasi: {
    type: String,
    enum: ['A', 'B', 'C', 'Belum Terakreditasi'],
    default: 'Belum Terakreditasi'
  }
}, {
  timestamps: true
});

// Index untuk query yang sering digunakan
schoolSchema.index({ jenjang: 1 });
schoolSchema.index({ status_sekolah: 1 });
schoolSchema.index({ kemendagri_nama_kecamatan: 1 });
schoolSchema.index({ nama_kabupaten_kota: 1 });
// npsn sudah unique: true di schema, tidak perlu index lagi

module.exports = mongoose.model('School', schoolSchema);
