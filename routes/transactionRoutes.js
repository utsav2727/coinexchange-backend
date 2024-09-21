const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Transaction = require('../model/Transactions');

// Create a new user
router.get("/", authMiddleware , async (req, res) => {
  try {
    const data = await Transaction.find({userId:req.user.userId}).populate('userId', 'username email');
    res.status(200).json(data);
} catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;