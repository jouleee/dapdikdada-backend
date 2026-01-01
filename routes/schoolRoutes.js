const express = require('express');
const router = express.Router();
const {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolStats,
  getSchoolByNPSN,
  getKecamatanList,
  getKabupatenList,
  getPersebaranAnalysis,
  getComparisonAnalysis
} = require('../controllers/schoolController');

const { protect } = require('../middleware/auth');

// Stats dan Analysis routes (public - untuk dashboard)
router.get('/stats', getSchoolStats);
router.get('/analysis/persebaran', getPersebaranAnalysis);
router.get('/analysis/comparison', getComparisonAnalysis);

// List routes (public)
router.get('/kecamatan', getKecamatanList);
router.get('/kabupaten', getKabupatenList);

// Get by NPSN (public)
router.get('/npsn/:npsn', getSchoolByNPSN);

// CRUD routes
router.route('/')
  .get(getAllSchools)  // Public - untuk list sekolah
  .post(protect, createSchool);  // Protected - hanya admin bisa create

router.route('/:id')
  .get(getSchoolById)  // Public - untuk detail sekolah
  .put(protect, updateSchool)  // Protected - hanya admin bisa update
  .delete(protect, deleteSchool);  // Protected - hanya admin bisa delete

module.exports = router;
