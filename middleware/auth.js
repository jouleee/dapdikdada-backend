const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protect routes - harus login
exports.protect = async (req, res, next) => {
  let token;

  // Cek token di header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Pastikan token ada
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Tidak ada akses. Token tidak ditemukan'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');

    // Get admin dari token
    req.admin = await Admin.findById(decoded.id).select('-password');

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin tidak ditemukan'
      });
    }

    // Cek apakah admin masih aktif
    if (!req.admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Akun tidak aktif'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token tidak valid atau expired'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: `Role ${req.admin.role} tidak memiliki akses ke resource ini`
      });
    }
    next();
  };
};
