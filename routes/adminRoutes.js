const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

// Semua routes ini hanya untuk superadmin
router.use(protect);
router.use(authorize('superadmin'));

router.route('/')
  .get(getAllAdmins)
  .post(createAdmin);

router.route('/:id')
  .get(getAdmin)
  .put(updateAdmin)
  .delete(deleteAdmin);

router.put('/:id/reset-password', resetAdminPassword);

module.exports = router;
