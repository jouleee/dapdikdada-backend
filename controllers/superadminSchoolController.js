const School = require('../models/School');

// @desc    Create new school (Superadmin only)
// @route   POST /api/admin/schools
// @access  Private/Superadmin
exports.createSchool = async (req, res) => {
  try {
    const {
      nama_sekolah,
      npsn,
      jenjang,
      status_sekolah,
      alamat_sekolah,
      kode_provinsi,
      nama_provinsi,
      kode_kabupaten_kota,
      nama_kabupaten_kota,
      kemendagri_kode_kecamatan,
      kemendagri_nama_kecamatan,
      akreditasi,
      jumlah_siswa,
      tahun
    } = req.body;

    // Validasi required fields
    if (!nama_sekolah || !npsn || !jenjang || !status_sekolah || !alamat_sekolah) {
      return res.status(400).json({
        success: false,
        error: 'Field required: nama_sekolah, npsn, jenjang, status_sekolah, alamat_sekolah'
      });
    }

    // Cek NPSN sudah ada
    const schoolExists = await School.findOne({ npsn });
    if (schoolExists) {
      return res.status(400).json({
        success: false,
        error: `Sekolah dengan NPSN ${npsn} sudah terdaftar`
      });
    }

    // Buat sekolah baru
    const school = await School.create({
      nama_sekolah,
      npsn,
      jenjang,
      status_sekolah: status_sekolah.toUpperCase(),
      alamat_sekolah,
      kode_provinsi: kode_provinsi || '32',
      nama_provinsi: nama_provinsi || 'JAWA BARAT',
      kode_kabupaten_kota,
      nama_kabupaten_kota,
      kemendagri_kode_kecamatan,
      kemendagri_nama_kecamatan,
      akreditasi: akreditasi || 'TT',
      jumlah_siswa: jumlah_siswa || 0,
      tahun: tahun || new Date().getFullYear()
    });

    res.status(201).json({
      success: true,
      message: 'Sekolah berhasil dibuat',
      data: school
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update school (Superadmin only - can update ALL fields including "sakral")
// @route   PUT /api/admin/schools/:id
// @access  Private/Superadmin
exports.updateSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'Sekolah tidak ditemukan'
      });
    }

    // Superadmin bisa update semua field
    const allowedFields = [
      'nama_sekolah',
      'npsn',
      'jenjang',
      'status_sekolah',
      'alamat_sekolah',
      'kode_provinsi',
      'nama_provinsi',
      'kode_kabupaten_kota',
      'nama_kabupaten_kota',
      'bps_kode_kecamatan',
      'bps_nama_kecamatan',
      'kemendagri_kode_kecamatan',
      'kemendagri_nama_kecamatan',
      'akreditasi',
      'jumlah_siswa',
      'tahun'
    ];

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

// @desc    Delete school (Superadmin only)
// @route   DELETE /api/admin/schools/:id
// @access  Private/Superadmin
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'Sekolah tidak ditemukan'
      });
    }

    await school.deleteOne();

    res.json({
      success: true,
      message: 'Sekolah berhasil dihapus',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get school by ID (Superadmin only)
// @route   GET /api/admin/schools/:id
// @access  Private/Superadmin
exports.getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'Sekolah tidak ditemukan'
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

// @desc    Get all schools with filters (Superadmin only)
// @route   GET /api/admin/schools
// @access  Private/Superadmin
exports.getAllSchoolsAdmin = async (req, res) => {
  try {
    const {
      jenjang,
      status_sekolah,
      kabupaten,
      akreditasi,
      sort = 'nama_sekolah',
      order = 'asc',
      page = 1,
      limit = 50,
      search
    } = req.query;

    // Build query
    const query = {};
    
    if (jenjang) query.jenjang = jenjang.toUpperCase();
    if (status_sekolah) query.status_sekolah = status_sekolah.toUpperCase();
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
    
    // Sorting
    const sortField = typeof sort === 'string' ? sort : 'nama_sekolah';
    const sortOrder = String(order).toLowerCase() === 'desc' ? -1 : 1;
    const sortObj = { [sortField]: sortOrder };

    const schools = await School.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort(sortObj);

    res.json({
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
      error: error.message
    });
  }
};

// @desc    Get distinct akreditasi values (Superadmin only)
// @route   GET /api/admin/schools/akreditasi
// @access  Private/Superadmin
exports.getAkreditasiListAdmin = async (req, res) => {
  try {
    const list = await School.distinct('akreditasi');
    const sorted = list
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)));
    res.json({
      success: true,
      count: sorted.length,
      data: sorted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
