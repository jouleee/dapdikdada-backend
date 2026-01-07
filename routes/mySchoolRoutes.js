const express = require('express');
const router = express.Router();
const {
  getMySchool,
  updateMySchool,
  getMySchoolStudents,
  updateStudentCount
} = require('../controllers/schoolAdminController');

const { protect, authorize } = require('../middleware/auth');

// Semua routes ini untuk admin biasa (operator sekolah)
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getMySchool)
  .put(updateMySchool);

router.get('/students', getMySchoolStudents);
router.put('/student-count', updateStudentCount);

module.exports = router;
