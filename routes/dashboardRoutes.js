const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getAdminDashboardStats 
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', getDashboardStats);
router.get('/admin-stats', protect, getAdminDashboardStats);

module.exports = router;
