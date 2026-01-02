const School = require('../models/School');
const StudentStatistic = require('../models/Student');
const EducationProgram = require('../models/EducationProgram');

// @desc    Get comprehensive dashboard statistics dengan MongoDB Aggregation Pipeline
// @route   GET /api/dashboard/stats
// @access  Public
exports.getDashboardStats = async (req, res) => {
  try {
    const { tahun_ajaran } = req.query;

    // Query 1: Complex aggregation dengan $facet untuk multiple pipelines dalam satu query
    const schoolStats = await School.aggregate([
      {
        $facet: {
          // Pipeline 1: Total counts dan basic statistics
          overview: [
            {
              $group: {
                _id: null,
                total_sekolah: { $sum: 1 },
                total_siswa_registered: { $sum: '$jumlah_siswa' }
              }
            }
          ],
          // Pipeline 2: Distribusi berdasarkan jenjang dengan conditional aggregation
          byJenjang: [
            {
              $group: {
                _id: '$jenjang',
                jumlah_sekolah: { $sum: 1 },
                sekolah_negeri: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, 1, 0] }
                },
                sekolah_swasta: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, 1, 0] }
                },
                avg_siswa_per_sekolah: { $avg: '$jumlah_siswa' }
              }
            },
            { $sort: { _id: 1 } }
          ],
          // Pipeline 3: Distribusi status dengan percentage
          byStatus: [
            {
              $group: {
                _id: '$status_sekolah',
                count: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: 'schools',
                pipeline: [{ $count: 'total' }],
                as: 'totalSchools'
              }
            },
            {
              $project: {
                status: '$_id',
                count: 1,
                percentage: {
                  $multiply: [
                    { $divide: ['$count', { $arrayElemAt: ['$totalSchools.total', 0] }] },
                    100
                  ]
                }
              }
            }
          ],
          // Pipeline 4: Distribusi akreditasi dengan details
          byAkreditasi: [
            {
              $group: {
                _id: '$akreditasi',
                count: { $sum: 1 },
                sekolah_list: {
                  $push: {
                    nama: '$nama_sekolah',
                    kabupaten: '$nama_kabupaten_kota'
                  }
                }
              }
            },
            { $sort: { count: -1 } },
            {
              $project: {
                akreditasi: '$_id',
                count: 1,
                sample_schools: { $slice: ['$sekolah_list', 5] }
              }
            }
          ],
          // Pipeline 5: Top kabupaten dengan breakdown per jenjang
          topKabupaten: [
            {
              $group: {
                _id: '$nama_kabupaten_kota',
                total_sekolah: { $sum: 1 },
                sekolah_negeri: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, 1, 0] }
                },
                sekolah_swasta: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, 1, 0] }
                },
                // Count schools by jenjang
                SD: {
                  $sum: { $cond: [{ $eq: ['$jenjang', 'SD'] }, 1, 0] }
                },
                SMP: {
                  $sum: { $cond: [{ $eq: ['$jenjang', 'SMP'] }, 1, 0] }
                },
                SMA: {
                  $sum: { $cond: [{ $eq: ['$jenjang', 'SMA'] }, 1, 0] }
                },
                SMK: {
                  $sum: { $cond: [{ $eq: ['$jenjang', 'SMK'] }, 1, 0] }
                },
                SLB: {
                  $sum: { $cond: [{ $eq: ['$jenjang', 'SLB'] }, 1, 0] }
                }
              }
            },
            { $sort: { total_sekolah: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 1,
                total_sekolah: 1,
                sekolah_negeri: 1,
                sekolah_swasta: 1,
                jenjang: {
                  SD: '$SD',
                  SMP: '$SMP',
                  SMA: '$SMA',
                  SMK: '$SMK',
                  SLB: '$SLB'
                }
              }
            }
          ],
          // Pipeline 6: Kecamatan dengan sekolah terbanyak
          topKecamatan: [
            {
              $group: {
                _id: {
                  kecamatan: '$kemendagri_nama_kecamatan',
                  kabupaten: '$nama_kabupaten_kota'
                },
                jumlah_sekolah: { $sum: 1 },
                jenjang_tersedia: { $addToSet: '$jenjang' }
              }
            },
            { $sort: { jumlah_sekolah: -1 } },
            { $limit: 15 }
          ],
          // Pipeline 7: Count unique kabupaten
          uniqueKabupaten: [
            {
              $group: {
                _id: '$nama_kabupaten_kota'
              }
            },
            {
              $count: 'total'
            }
          ]
        }
      }
    ]);

    // Query 2: Student statistics dengan filter tahun ajaran (conditional query)
    const matchStage = tahun_ajaran ? { tahun_ajaran } : {};
    const studentStats = await StudentStatistic.aggregate([
      { $match: matchStage },
      {
        $facet: {
          totalSiswa: [
            {
              $group: {
                _id: null,
                total: { $sum: '$jumlah_siswa' }
              }
            }
          ],
          byJenjang: [
            {
              $group: {
                _id: '$jenjang',
                total_siswa: { $sum: '$jumlah_siswa' },
                siswa_negeri: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, '$jumlah_siswa', 0] }
                },
                siswa_swasta: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, '$jumlah_siswa', 0] }
                }
              }
            },
            { $sort: { _id: 1 } }
          ],
          topKabupaten: [
            {
              $group: {
                _id: '$nama_kabupaten_kota',
                total_siswa: { $sum: '$jumlah_siswa' },
                breakdown: {
                  $push: {
                    jenjang: '$jenjang',
                    jumlah: '$jumlah_siswa',
                    status: '$status_sekolah'
                  }
                }
              }
            },
            { $sort: { total_siswa: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    // Query 3: Get available years untuk filter
    const availableYears = await StudentStatistic.distinct('tahun_ajaran');

    // Query 4: Program count
    const totalPrograms = await EducationProgram.countDocuments();

    // Query 5: Get total unique kabupaten/kota
    const totalKabupaten = await School.distinct('nama_kabupaten_kota');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          sekolah: schoolStats[0].overview[0] || {},
          siswa: studentStats[0].totalSiswa[0] || { total: 0 },
          programs: totalPrograms,
          tahun_ajaran_tersedia: availableYears.sort(),
          total_kabupaten: totalKabupaten.length
        },
        sekolah: {
          byJenjang: schoolStats[0].byJenjang,
          byStatus: schoolStats[0].byStatus,
          byAkreditasi: schoolStats[0].byAkreditasi,
          topKabupaten: schoolStats[0].topKabupaten,
          topKecamatan: schoolStats[0].topKecamatan
        },
        siswa: {
          byJenjang: studentStats[0].byJenjang,
          topKabupaten: studentStats[0].topKabupaten
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil data dashboard',
      error: error.message
    });
  }
};
