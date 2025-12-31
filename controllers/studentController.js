const StudentStatistic = require('../models/Student');

// @desc    Get all student statistics dengan filter
// @route   GET /api/students
// @access  Public
exports.getAllStudentStatistics = async (req, res) => {
  try {
    const {
      jenjang,
      status_sekolah,
      kabupaten,
      tahun_ajaran,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    
    if (jenjang) query.jenjang = jenjang.toUpperCase();
    if (status_sekolah) query.status_sekolah = status_sekolah.toUpperCase();
    if (kabupaten) query.nama_kabupaten_kota = new RegExp(kabupaten, 'i');
    if (tahun_ajaran) query.tahun_ajaran = tahun_ajaran;

    // Execute query dengan pagination
    const skip = (page - 1) * limit;
    const statistics = await StudentStatistic.find(query)
      .sort({ tahun_ajaran: -1, nama_kabupaten_kota: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count
    const total = await StudentStatistic.countDocuments(query);

    res.status(200).json({
      success: true,
      count: statistics.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get student statistics summary per kabupaten
// @route   GET /api/students/summary/kabupaten
// @access  Public
exports.getStudentsByKabupaten = async (req, res) => {
  try {
    const { tahun_ajaran } = req.query;
    
    const matchStage = tahun_ajaran 
      ? { tahun_ajaran } 
      : {};

    const statistics = await StudentStatistic.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            kabupaten: '$nama_kabupaten_kota',
            kode_kabupaten: '$kode_kabupaten_kota'
          },
          total_siswa: { $sum: '$jumlah_siswa' },
          siswa_negeri: {
            $sum: {
              $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, '$jumlah_siswa', 0]
            }
          },
          siswa_swasta: {
            $sum: {
              $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, '$jumlah_siswa', 0]
            }
          }
        }
      },
      { $sort: { total_siswa: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: statistics.length,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get student statistics summary per jenjang
// @route   GET /api/students/summary/jenjang
// @access  Public
exports.getStudentsByJenjang = async (req, res) => {
  try {
    const { tahun_ajaran, kabupaten } = req.query;
    
    const matchStage = {};
    if (tahun_ajaran) matchStage.tahun_ajaran = tahun_ajaran;
    if (kabupaten) matchStage.nama_kabupaten_kota = new RegExp(kabupaten, 'i');

    const statistics = await StudentStatistic.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$jenjang',
          total_siswa: { $sum: '$jumlah_siswa' },
          siswa_negeri: {
            $sum: {
              $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, '$jumlah_siswa', 0]
            }
          },
          siswa_swasta: {
            $sum: {
              $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, '$jumlah_siswa', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: statistics.length,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get student statistics trends over years
// @route   GET /api/students/trends
// @access  Public
exports.getStudentTrends = async (req, res) => {
  try {
    const { jenjang, kabupaten } = req.query;
    
    const matchStage = {};
    if (jenjang) matchStage.jenjang = jenjang.toUpperCase();
    if (kabupaten) matchStage.nama_kabupaten_kota = new RegExp(kabupaten, 'i');

    const trends = await StudentStatistic.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            tahun_ajaran: '$tahun_ajaran',
            jenjang: '$jenjang'
          },
          total_siswa: { $sum: '$jumlah_siswa' }
        }
      },
      { $sort: { '_id.tahun_ajaran': 1, '_id.jenjang': 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get overall statistics
// @route   GET /api/students/stats
// @access  Public
exports.getOverallStats = async (req, res) => {
  try {
    const { tahun_ajaran } = req.query;
    
    const matchStage = tahun_ajaran ? { tahun_ajaran } : {};

    const stats = await StudentStatistic.aggregate([
      { $match: matchStage },
      {
        $facet: {
          byJenjang: [
            {
              $group: {
                _id: '$jenjang',
                total_siswa: { $sum: '$jumlah_siswa' }
              }
            },
            { $sort: { _id: 1 } }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status_sekolah',
                total_siswa: { $sum: '$jumlah_siswa' }
              }
            }
          ],
          byKabupaten: [
            {
              $group: {
                _id: '$nama_kabupaten_kota',
                total_siswa: { $sum: '$jumlah_siswa' }
              }
            },
            { $sort: { total_siswa: -1 } },
            { $limit: 10 }
          ],
          totalOverall: [
            {
              $group: {
                _id: null,
                total_siswa: { $sum: '$jumlah_siswa' },
                total_records: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get available tahun ajaran list
// @route   GET /api/students/tahun-ajaran
// @access  Public
exports.getTahunAjaranList = async (req, res) => {
  try {
    const tahunAjaran = await StudentStatistic.distinct('tahun_ajaran');
    
    res.status(200).json({
      success: true,
      count: tahunAjaran.length,
      data: tahunAjaran.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
