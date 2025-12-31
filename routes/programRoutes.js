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

// Stats route
router.get('/stats', getProgramStats);

// Get programs by school
router.get('/school/:schoolId', getProgramsBySchool);

// CRUD routes
router.route('/')
  .get(getAllPrograms)
  .post(createProgram);

router.route('/:id')
  .get(getProgramById)
  .put(updateProgram)
  .delete(deleteProgram);

module.exports = router;
