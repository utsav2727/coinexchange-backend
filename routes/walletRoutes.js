// routes/currencyRoutes.js
const express = require('express');
const router = express.Router();
const Wallet = require('../model/Wallet');
const Currency = require('../model/Currency');

router.get('/', async (req, res) => {
  try {
    const wallet = await Wallet.find().populate('currencyId').populate('userId');
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/walletByUser', async (req, res) => {
    try {
        let currentUser = req.user.userId;
        const walletBalance = await Wallet.findOne({userId:currentUser}).populate('currencyId').populate('userId');
        console.log('wallet', walletBalance);

        res.json({
          balance:walletBalance?.amount || 0,
          currency:walletBalance?.currencyId.tag || '',
          userId:walletBalance?.userId._id || req.user.userId
        });
      } catch (err) {
        console.log('err', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router


