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

// Stats dan Analysis routes (harus di atas /:id)
router.get('/stats', getSchoolStats);
router.get('/analysis/persebaran', getPersebaranAnalysis);
router.get('/analysis/comparison', getComparisonAnalysis);

// List routes
router.get('/kecamatan', getKecamatanList);
router.get('/kabupaten', getKabupatenList);

// Get by NPSN
router.get('/npsn/:npsn', getSchoolByNPSN);

// CRUD routes
router.route('/')
  .get(getAllSchools)
  .post(createSchool);

router.route('/:id')
  .get(getSchoolById)
  .put(updateSchool)
  .delete(deleteSchool);

module.exports = router;
