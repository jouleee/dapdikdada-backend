const express = require('express');
const router = express.Router();
const {
  getAllSchoolsAdmin,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getAkreditasiListAdmin
} = require('../controllers/superadminSchoolController');

const { protect, authorize } = require('../middleware/auth');

// Semua routes ini hanya untuk superadmin
router.use(protect);
router.use(authorize('superadmin'));

router.route('/')
  .get(getAllSchoolsAdmin)
  .post(createSchool);

router.route('/:id')
  .get(getSchoolById)
  .put(updateSchool)
  .delete(deleteSchool);

// Distinct akreditasi list
router.get('/akreditasi/list', getAkreditasiListAdmin);

module.exports = router;
