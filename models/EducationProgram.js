const mongoose = require('mongoose');

const educationProgramSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  nama_program: {
    type: String,
    required: [true, 'Nama program harus diisi'],
    trim: true
  },
  tahun: {
    type: Number,
    required: [true, 'Tahun harus diisi'],
    min: 2000,
    max: 2100
  },
  jumlah_penerima: {
    type: Number,
    required: [true, 'Jumlah penerima harus diisi'],
    min: 0
  },
  sekolah_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'Sekolah ID harus diisi']
  },
  npsn: {
    type: String,
    trim: true
  },
  deskripsi: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EducationProgram', educationProgramSchema);
