const express = require('express');
const router = express.Router();
const multer = require('multer');
const Support = require('../model/Support');
const authMiddleware = require('../middleware/authMiddleware');

// Multer setup for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/supportDocs/'); // Folder for support document uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// @route   POST /api/support
// @desc    Submit a support request
router.post('/',authMiddleware, upload.single('documentFile'), async (req, res) => {
  try {
    const userId = req.user.userId
    const { email, username, message } = req.body;

    const newSupport = new Support({
        userId,
      email,
      username,
      message,
      documentFile: req.file ? req.file.path : null, // File path if the document is uploaded
    });

    await newSupport.save();
    res.status(201).json({ message: 'Support request submitted successfully', support: newSupport });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @route   GET /api/support
// @desc    Get all support requests
router.get('/', async (req, res) => {
  try {
    const supportRequests = await Support.find();
    res.status(200).json(supportRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @route   GET /api/support/:id
// @desc    Get a support request by ID
router.get('/:id', async (req, res) => {
  try {
    const supportRequest = await Support.findById(req.params.id);
    
    if (!supportRequest) {
      return res.status(404).json({ message: 'Support request not found' });
    }

    res.status(200).json(supportRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @route   DELETE /api/support/:id
// @desc    Delete a support request by ID
router.delete('/:id', async (req, res) => {
  try {
    const supportRequest = await Support.findByIdAndDelete(req.params.id);

    if (!supportRequest) {
      return res.status(404).json({ message: 'Support request not found' });
    }

    res.status(200).json({ message: 'Support request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
