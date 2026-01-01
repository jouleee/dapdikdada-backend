const express = require('express');
const router = express.Router();
const {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramsBySchool,
  getProgramStats
} = require('../controllers/programController');

const { protect } = require('../middleware/auth');

// Stats route (public)
router.get('/stats', getProgramStats);

// Get programs by school (public)
router.get('/school/:schoolId', getProgramsBySchool);

// CRUD routes
router.route('/')
  .get(getAllPrograms)  // Public - untuk list program
  .post(protect, createProgram);  // Protected - hanya admin bisa create

router.route('/:id')
  .get(getProgramById)  // Public - untuk detail program
  .put(protect, updateProgram)  // Protected - hanya admin bisa update
  .delete(protect, deleteProgram);  // Protected - hanya admin bisa delete

module.exports = router;
