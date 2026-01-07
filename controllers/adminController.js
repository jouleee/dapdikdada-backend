const Admin = require('../models/Admin');
const School = require('../models/School');

// @desc    Get all admins (Superadmin only)
// @route   GET /api/admin/users
// @access  Private/Superadmin
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .populate('school_id', 'nama_sekolah npsn')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single admin (Superadmin only)
// @route   GET /api/admin/users/:id
// @access  Private/Superadmin
exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id)
      .populate('school_id', 'nama_sekolah npsn')
      .select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create admin (Superadmin only)
// @route   POST /api/admin/users
// @access  Private/Superadmin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role, npsn, phone } = req.body;

    // Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nama, email, dan password wajib diisi'
      });
    }

    // Cek email sudah ada
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        error: 'Email sudah terdaftar'
      });
    }

    // Jika role admin biasa, harus ada NPSN
    let school_id = null;
    if (role === 'admin' && npsn) {
      const school = await School.findOne({ npsn });
      if (!school) {
        return res.status(404).json({
          success: false,
          error: 'Sekolah dengan NPSN tersebut tidak ditemukan'
        });
      }
      school_id = school._id;
    }

    // Buat admin baru
    const admin = await Admin.create({
      name,
      email,
      password,
      role: role || 'admin',
      npsn: role === 'admin' ? npsn : null,
      school_id,
      phone,
      isActive: true
    });

    // Populate school info
    await admin.populate('school_id', 'nama_sekolah npsn');

    res.status(201).json({
      success: true,
      message: 'Admin berhasil dibuat',
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        npsn: admin.npsn,
        school_id: admin.school_id,
        phone: admin.phone,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update admin (Superadmin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Superadmin
exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, role, npsn, phone, isActive } = req.body;

    let admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin tidak ditemukan'
      });
    }

    // Update fields
    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.role = role || admin.role;
    admin.phone = phone || admin.phone;
    admin.isActive = isActive !== undefined ? isActive : admin.isActive;

    // Update NPSN dan school_id jika role admin
    if (admin.role === 'admin' && npsn) {
      const school = await School.findOne({ npsn });
      if (school) {
        admin.npsn = npsn;
        admin.school_id = school._id;
      }
    } else if (admin.role === 'superadmin') {
      admin.npsn = null;
      admin.school_id = null;
    }

    await admin.save();
    await admin.populate('school_id', 'nama_sekolah npsn');

    res.json({
      success: true,
      message: 'Admin berhasil diupdate',
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete admin (Superadmin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Superadmin
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin tidak ditemukan'
      });
    }

    // Prevent deleting superadmin
    if (admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Tidak dapat menghapus superadmin'
      });
    }

    await admin.deleteOne();

    res.json({
      success: true,
      message: 'Admin berhasil dihapus',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Reset password admin (Superadmin only)
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private/Superadmin
exports.resetAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password baru minimal 6 karakter'
      });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin tidak ditemukan'
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password berhasil direset'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
