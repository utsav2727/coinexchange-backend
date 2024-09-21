const express = require('express');
const router = express.Router();
const multer = require('multer');
const Kyc = require('../model/Kyc');
const authMiddleware = require('../middleware/authMiddleware');

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder to store uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// @route   POST /api/kyc
// @desc    Upload KYC document
router.post('/kyc', authMiddleware, upload.single('documentFile'), async (req, res) => {
  try {

    const userId = req.user.userId;
    const { documentType, documentNumber } = req.body;

    const newKyc = new Kyc({
      userId,
      documentType,
      documentNumber,
      documentFile: req.file.path, // Path to the uploaded document
    });

    await newKyc.save();
    res.status(201).json({ message: 'KYC document uploaded successfully', kyc: newKyc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @route   GET /api/kyc/:id
// @desc    Get KYC details by user ID
router.get('/kyc/:id', async (req, res) => {
  try {
    const kyc = await Kyc.findOne({ userId: req.params.id });
    
    if (!kyc) {
      return res.status(404).json({ message: 'KYC not found' });
    }

    res.status(200).json(kyc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @route   PUT /api/kyc/:id
// @desc    Update KYC status
router.put('/kyc/:id', async (req, res) => {
  try {
    const kyc = await Kyc.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, updatedAt: Date.now() },
      { new: true }
    );

    if (!kyc) {
      return res.status(404).json({ message: 'KYC not found' });
    }

    res.status(200).json({ message: 'KYC status updated successfully', kyc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
