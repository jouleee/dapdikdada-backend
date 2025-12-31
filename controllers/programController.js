const EducationProgram = require('../models/EducationProgram');

// @desc    Get all education programs
// @route   GET /api/programs
// @access  Public
exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await EducationProgram.find().populate('sekolah_id', 'nama_sekolah jenjang');
    res.status(200).json({
      success: true,
      count: programs.length,
      data: programs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil data program',
      error: error.message
    });
  }
};

// @desc    Get single education program
// @route   GET /api/programs/:id
// @access  Public
exports.getProgramById = async (req, res) => {
  try {
    const program = await EducationProgram.findById(req.params.id).populate('sekolah_id', 'nama_sekolah jenjang');
    
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: program
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil data program',
      error: error.message
    });
  }
};

// @desc    Create new education program
// @route   POST /api/programs
// @access  Public
exports.createProgram = async (req, res) => {
  try {
    const program = await EducationProgram.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Program berhasil ditambahkan',
      data: program
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error menambahkan program',
      error: error.message
    });
  }
};

// @desc    Update education program
// @route   PUT /api/programs/:id
// @access  Public
exports.updateProgram = async (req, res) => {
  try {
    const program = await EducationProgram.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Program berhasil diupdate',
      data: program
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error mengupdate program',
      error: error.message
    });
  }
};

// @desc    Delete education program
// @route   DELETE /api/programs/:id
// @access  Public
exports.deleteProgram = async (req, res) => {
  try {
    const program = await EducationProgram.findByIdAndDelete(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Program berhasil dihapus',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error menghapus program',
      error: error.message
    });
  }
};

// @desc    Get programs by school
// @route   GET /api/programs/school/:schoolId
// @access  Public
exports.getProgramsBySchool = async (req, res) => {
  try {
    const programs = await EducationProgram.find({ sekolah_id: req.params.schoolId });
    
    res.status(200).json({
      success: true,
      count: programs.length,
      data: programs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil data program',
      error: error.message
    });
  }
};

// @desc    Get programs statistics
// @route   GET /api/programs/stats
// @access  Public
exports.getProgramStats = async (req, res) => {
  try {
    const yearStats = await EducationProgram.aggregate([
      {
        $group: {
          _id: '$tahun',
          count: { $sum: 1 },
          totalPenerima: { $sum: '$jumlah_penerima' }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: yearStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error mengambil statistik program',
      error: error.message
    });
  }
};
