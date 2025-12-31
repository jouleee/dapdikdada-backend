const School = require('../models/School');

// @desc    Get all schools
// @route   GET /api/schools
// @access  Public
exports.getAllSchools = async (req, res) => {
  try {
    const {
      jenjang,
      status_sekolah,
      kecamatan,
      kabupaten,
      akreditasi,
      page = 1,
      limit = 50,
      search
    } = req.query;

    // Build query
    const query = {};
    
    if (jenjang) query.jenjang = jenjang.toUpperCase();
    if (status_sekolah) query.status_sekolah = status_sekolah.toUpperCase();
    if (kecamatan) query.kemendagri_nama_kecamatan = new RegExp(kecamatan, 'i');
    if (kabupaten) query.nama_kabupaten_kota = new RegExp(kabupaten, 'i');
    if (akreditasi) query.akreditasi = akreditasi;
    if (search) {
      query.$or = [
        { nama_sekolah: new RegExp(search, 'i') },
        { npsn: new RegExp(search, 'i') },
        { alamat_sekolah: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await School.countDocuments(query);
    
    const schools = await School.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ nama_sekolah: 1 });

    res.status(200).json({
      success: true,
      count: schools.length,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: schools
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil data sekolah',
      error: error.message
    });
  }
};

// @desc    Get single school
// @route   GET /api/schools/:id
// @access  Public
exports.getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Sekolah tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil data sekolah',
      error: error.message
    });
  }
};

// @desc    Create new school
// @route   POST /api/schools
// @access  Public
exports.createSchool = async (req, res) => {
  try {
    const school = await School.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Sekolah berhasil ditambahkan',
      data: school
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error menambahkan sekolah',
      error: error.message
    });
  }
};

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Public
exports.updateSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Sekolah tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sekolah berhasil diupdate',
      data: school
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error mengupdate sekolah',
      error: error.message
    });
  }
};

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Public
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Sekolah tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sekolah berhasil dihapus',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error menghapus sekolah',
      error: error.message
    });
  }
};

// @desc    Get schools statistics dengan Advanced MongoDB Aggregation
// @route   GET /api/schools/stats
// @access  Public
exports.getSchoolStats = async (req, res) => {
  try {
    // Query menggunakan $facet untuk multiple aggregation pipelines
    const stats = await School.aggregate([
      {
        $facet: {
          // Pipeline 1: Stats by Jenjang dengan conditional sum
          byJenjang: [
            {
              $group: {
                _id: '$jenjang',
                count: { $sum: 1 },
                totalSiswa: { $sum: '$jumlah_siswa' },
                negeri_count: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, 1, 0] }
                },
                swasta_count: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, 1, 0] }
                },
                // Akreditasi distribution per jenjang
                akreditasi_A: {
                  $sum: { $cond: [{ $eq: ['$akreditasi', 'A'] }, 1, 0] }
                },
                akreditasi_B: {
                  $sum: { $cond: [{ $eq: ['$akreditasi', 'B'] }, 1, 0] }
                },
                akreditasi_C: {
                  $sum: { $cond: [{ $eq: ['$akreditasi', 'C'] }, 1, 0] }
                },
                belum_terakreditasi: {
                  $sum: { $cond: [{ $eq: ['$akreditasi', 'Belum Terakreditasi'] }, 1, 0] }
                }
              }
            },
            { $sort: { _id: 1 } }
          ],
          // Pipeline 2: Stats by Status with percentage
          byStatus: [
            {
              $group: {
                _id: '$status_sekolah',
                count: { $sum: 1 },
                total_siswa: { $sum: '$jumlah_siswa' },
                avg_siswa: { $avg: '$jumlah_siswa' },
                jenjang_breakdown: {
                  $push: {
                    jenjang: '$jenjang',
                    akreditasi: '$akreditasi'
                  }
                }
              }
            }
          ],
          // Pipeline 3: Stats by Akreditasi dengan details
          byAkreditasi: [
            {
              $group: {
                _id: '$akreditasi',
                count: { $sum: 1 },
                negeri: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, 1, 0] }
                },
                swasta: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, 1, 0] }
                },
                by_jenjang: {
                  $push: '$jenjang'
                }
              }
            },
            {
              $project: {
                akreditasi: '$_id',
                count: 1,
                negeri: 1,
                swasta: 1,
                jenjang_list: { $setUnion: ['$by_jenjang', []] }
              }
            }
          ],
          // Pipeline 4: Top Kabupaten dengan nested aggregation
          topKabupaten: [
            {
              $group: {
                _id: '$nama_kabupaten_kota',
                count: { $sum: 1 },
                total_siswa: { $sum: '$jumlah_siswa' },
                sekolah_negeri: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, 1, 0] }
                },
                sekolah_swasta: {
                  $sum: { $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, 1, 0] }
                },
                jenjang_tersedia: { $addToSet: '$jenjang' },
                avg_siswa_per_sekolah: { $avg: '$jumlah_siswa' },
                // Array of schools untuk sample
                schools_sample: {
                  $push: {
                    nama: '$nama_sekolah',
                    jenjang: '$jenjang',
                    status: '$status_sekolah'
                  }
                }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $project: {
                kabupaten: '$_id',
                count: 1,
                total_siswa: 1,
                sekolah_negeri: 1,
                sekolah_swasta: 1,
                jenjang_tersedia: 1,
                avg_siswa_per_sekolah: { $round: ['$avg_siswa_per_sekolah', 0] },
                sample_schools: { $slice: ['$schools_sample', 3] }
              }
            }
          ],
          // Pipeline 5: Top Kecamatan dengan details
          topKecamatan: [
            {
              $group: {
                _id: {
                  kecamatan: '$kemendagri_nama_kecamatan',
                  kabupaten: '$nama_kabupaten_kota'
                },
                count: { $sum: 1 },
                jenjang_tersedia: { $addToSet: '$jenjang' },
                status_breakdown: {
                  $push: '$status_sekolah'
                },
                akreditasi_breakdown: {
                  $push: '$akreditasi'
                }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 20 },
            {
              $project: {
                kecamatan: '$_id.kecamatan',
                kabupaten: '$_id.kabupaten',
                count: 1,
                jenjang_tersedia: 1,
                total_jenjang: { $size: '$jenjang_tersedia' }
              }
            }
          ],
          // Pipeline 6: Distribution by Kabupaten and Jenjang (Matrix)
          kabupatenJenjangMatrix: [
            {
              $group: {
                _id: {
                  kabupaten: '$nama_kabupaten_kota',
                  jenjang: '$jenjang'
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.kabupaten': 1, '_id.jenjang': 1 } },
            { $limit: 50 }
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
      message: 'Error mengambil statistik sekolah',
      error: error.message
    });
  }
};

// @desc    Get schools by NPSN
// @route   GET /api/schools/npsn/:npsn
// @access  Public
exports.getSchoolByNPSN = async (req, res) => {
  try {
    const school = await School.findOne({ npsn: req.params.npsn });
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Sekolah tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil data sekolah',
      error: error.message
    });
  }
};

// @desc    Get list of kecamatan
// @route   GET /api/schools/kecamatan
// @access  Public
exports.getKecamatanList = async (req, res) => {
  try {
    const { kabupaten } = req.query;
    const match = kabupaten ? { nama_kabupaten_kota: new RegExp(kabupaten, 'i') } : {};

    const kecamatanList = await School.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            kecamatan: '$kemendagri_nama_kecamatan',
            kabupaten: '$nama_kabupaten_kota',
            kode_kecamatan: '$kemendagri_kode_kecamatan'
          }
        }
      },
      {
        $project: {
          _id: 0,
          kecamatan: '$_id.kecamatan',
          kabupaten: '$_id.kabupaten',
          kode_kecamatan: '$_id.kode_kecamatan'
        }
      },
      { $sort: { kecamatan: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: kecamatanList.length,
      data: kecamatanList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil daftar kecamatan',
      error: error.message
    });
  }
};

// @desc    Get list of kabupaten
// @route   GET /api/schools/kabupaten
// @access  Public
exports.getKabupatenList = async (req, res) => {
  try {
    const kabupatenList = await School.aggregate([
      {
        $group: {
          _id: {
            kabupaten: '$nama_kabupaten_kota',
            kode_kabupaten: '$kode_kabupaten_kota'
          }
        }
      },
      {
        $project: {
          _id: 0,
          kabupaten: '$_id.kabupaten',
          kode_kabupaten: '$_id.kode_kabupaten'
        }
      },
      { $sort: { kabupaten: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: kabupatenList.length,
      data: kabupatenList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil daftar kabupaten',
      error: error.message
    });
  }
};

// @desc    Get analisis persebaran sekolah per wilayah dengan MongoDB Aggregation
// @route   GET /api/schools/analysis/persebaran
// @access  Public
exports.getPersebaranAnalysis = async (req, res) => {
  try {
    const { jenjang } = req.query;
    const matchStage = jenjang ? { jenjang: jenjang.toUpperCase() } : {};

    // Complex aggregation dengan $bucket, $facet, dan conditional operators
    const analysis = await School.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // Analisis per kabupaten
          perKabupaten: [
            {
              $group: {
                _id: '$nama_kabupaten_kota',
                total: { $sum: 1 },
                negeri: { $sum: { $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, 1, 0] } },
                swasta: { $sum: { $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, 1, 0] } },
                by_jenjang: { $addToSet: '$jenjang' }
              }
            },
            { $sort: { total: -1 } }
          ],
          // Bucketing berdasarkan jumlah siswa
          byStudentSize: [
            {
              $bucket: {
                groupBy: '$jumlah_siswa',
                boundaries: [0, 100, 500, 1000, 2000, 5000],
                default: '5000+',
                output: {
                  count: { $sum: 1 },
                  schools: {
                    $push: {
                      nama: '$nama_sekolah',
                      kabupaten: '$nama_kabupaten_kota',
                      siswa: '$jumlah_siswa'
                    }
                  }
                }
              }
            }
          ],
          // Density calculation per kecamatan
          densityPerKecamatan: [
            {
              $group: {
                _id: {
                  kecamatan: '$kemendagri_nama_kecamatan',
                  kabupaten: '$nama_kabupaten_kota'
                },
                jumlah_sekolah: { $sum: 1 },
                jenjang_list: { $addToSet: '$jenjang' },
                status_list: { $addToSet: '$status_sekolah' }
              }
            },
            {
              $project: {
                kecamatan: '$_id.kecamatan',
                kabupaten: '$_id.kabupaten',
                jumlah_sekolah: 1,
                kelengkapan_jenjang: { $size: '$jenjang_list' },
                variasi_status: { $size: '$status_list' }
              }
            },
            { $sort: { jumlah_sekolah: -1 } },
            { $limit: 20 }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: analysis[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil analisis persebaran',
      error: error.message
    });
  }
};

// @desc    Get comparison analysis antar kabupaten
// @route   GET /api/schools/analysis/comparison
// @access  Public
exports.getComparisonAnalysis = async (req, res) => {
  try {
    const { kabupaten1, kabupaten2 } = req.query;

    if (!kabupaten1 || !kabupaten2) {
      return res.status(400).json({
        success: false,
        message: 'Parameter kabupaten1 dan kabupaten2 harus diisi'
      });
    }

    // Aggregation dengan $cond dan comparison operators
    const comparison = await School.aggregate([
      {
        $match: {
          nama_kabupaten_kota: { 
            $in: [new RegExp(kabupaten1, 'i'), new RegExp(kabupaten2, 'i')] 
          }
        }
      },
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
          // Count per jenjang
          sd_count: { $sum: { $cond: [{ $eq: ['$jenjang', 'SD'] }, 1, 0] } },
          smp_count: { $sum: { $cond: [{ $eq: ['$jenjang', 'SMP'] }, 1, 0] } },
          sma_count: { $sum: { $cond: [{ $eq: ['$jenjang', 'SMA'] }, 1, 0] } },
          smk_count: { $sum: { $cond: [{ $eq: ['$jenjang', 'SMK'] }, 1, 0] } },
          slb_count: { $sum: { $cond: [{ $eq: ['$jenjang', 'SLB'] }, 1, 0] } },
          // Akreditasi breakdown
          akreditasi_A: { $sum: { $cond: [{ $eq: ['$akreditasi', 'A'] }, 1, 0] } },
          akreditasi_B: { $sum: { $cond: [{ $eq: ['$akreditasi', 'B'] }, 1, 0] } },
          akreditasi_C: { $sum: { $cond: [{ $eq: ['$akreditasi', 'C'] }, 1, 0] } },
          belum_terakreditasi: { $sum: { $cond: [{ $eq: ['$akreditasi', 'Belum Terakreditasi'] }, 1, 0] } },
          // Unique kecamatan count
          kecamatan_list: { $addToSet: '$kemendagri_nama_kecamatan' }
        }
      },
      {
        $project: {
          kabupaten: '$_id',
          total_sekolah: 1,
          sekolah_negeri: 1,
          sekolah_swasta: 1,
          rasio_negeri_swasta: {
            $round: [
              { $divide: ['$sekolah_negeri', { $cond: [{ $eq: ['$sekolah_swasta', 0] }, 1, '$sekolah_swasta'] }] },
              2
            ]
          },
          distribusi_jenjang: {
            SD: '$sd_count',
            SMP: '$smp_count',
            SMA: '$sma_count',
            SMK: '$smk_count',
            SLB: '$slb_count'
          },
          distribusi_akreditasi: {
            A: '$akreditasi_A',
            B: '$akreditasi_B',
            C: '$akreditasi_C',
            'Belum Terakreditasi': '$belum_terakreditasi'
          },
          jumlah_kecamatan: { $size: '$kecamatan_list' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: comparison.length,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil analisis perbandingan',
      error: error.message
    });
  }
};
