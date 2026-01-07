const School = require('../models/School');
const StudentStatistic = require('../models/Student');

// @desc    Get school data for logged in admin
// @route   GET /api/admin/my-school
// @access  Private/Admin
exports.getMySchool = async (req, res) => {
  try {
    if (!req.admin.school_id) {
      return res.status(404).json({
        success: false,
        error: 'Anda belum terhubung dengan sekolah manapun. Hubungi superadmin.'
      });
    }

    const school = await School.findById(req.admin.school_id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'Data sekolah tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: school
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update school profile (Admin can only update certain fields)
// @route   PUT /api/admin/my-school
// @access  Private/Admin
exports.updateMySchool = async (req, res) => {
  try {
    if (!req.admin.school_id) {
      return res.status(404).json({
        success: false,
        error: 'Anda belum terhubung dengan sekolah manapun'
      });
    }

    const school = await School.findById(req.admin.school_id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'Data sekolah tidak ditemukan'
      });
    }

    // Admin hanya bisa update field tertentu (tidak termasuk field "sakral")
    const allowedFields = [
      'alamat_sekolah',
      'jumlah_siswa'
    ];

    // Update hanya field yang diizinkan
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        school[field] = req.body[field];
      }
    });

    await school.save();

    res.json({
      success: true,
      message: 'Data sekolah berhasil diupdate',
      data: school
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get student statistics for my school
// @route   GET /api/admin/my-school/students
// @access  Private/Admin
exports.getMySchoolStudents = async (req, res) => {
  try {
    if (!req.admin.npsn) {
      return res.status(404).json({
        success: false,
        error: 'NPSN tidak ditemukan'
      });
    }

    const school = await School.findById(req.admin.school_id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'Data sekolah tidak ditemukan'
      });
    }

    // Get student statistics for this school's kabupaten and jenjang
    const stats = await StudentStatistic.find({
      nama_kabupaten_kota: school.nama_kabupaten_kota,
      jenjang: school.jenjang
    }).sort({ tahun_ajaran: -1 });

    res.json({
      success: true,
      count: stats.length,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update student count for my school
// @route   PUT /api/admin/my-school/student-count
// @access  Private/Admin
exports.updateStudentCount = async (req, res) => {
  try {
    const { jumlah_siswa } = req.body;

    if (!req.admin.school_id) {
      return res.status(404).json({
        success: false,
        error: 'Anda belum terhubung dengan sekolah'
      });
    }

    if (jumlah_siswa === undefined || jumlah_siswa < 0) {
      return res.status(400).json({
        success: false,
        error: 'Jumlah siswa tidak valid'
      });
    }

    const school = await School.findById(req.admin.school_id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'Data sekolah tidak ditemukan'
      });
    }

    school.jumlah_siswa = jumlah_siswa;
    await school.save();

    res.json({
      success: true,
      message: 'Jumlah siswa berhasil diupdate',
      data: {
        jumlah_siswa: school.jumlah_siswa
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
