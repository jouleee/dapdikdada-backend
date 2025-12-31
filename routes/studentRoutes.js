const express = require('express');
const router = express.Router();
const {
  getAllStudentStatistics,
  getStudentsByKabupaten,
  getStudentsByJenjang,
  getStudentTrends,
  getOverallStats,
  getTahunAjaranList
} = require('../controllers/studentController');

// Statistics routes - harus di atas route dengan parameter
router.get('/stats', getOverallStats);
router.get('/summary/kabupaten', getStudentsByKabupaten);
router.get('/summary/jenjang', getStudentsByJenjang);
router.get('/trends', getStudentTrends);
router.get('/tahun-ajaran', getTahunAjaranList);

// Main route untuk list statistics
router.get('/', getAllStudentStatistics);

module.exports = router;
