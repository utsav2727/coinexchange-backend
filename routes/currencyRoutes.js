// routes/currencyRoutes.js
const express = require('express');
const router = express.Router();
const Currency = require('../model/Currency'); 

router.get('/', async (req, res) => {
  try {
    const currencies = await Currency.find();
    res.json(currencies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single currency by ID
router.get('/:id', getCurrency, (req, res) => {
  res.json(res.currency);
});

// Create a new currency
router.post('/', async (req, res) => {
  const currency = new Currency({
    name: req.body.name,
    symbol: req.body.symbol,
    tag: req.body.tag,
    conversionRate: req.body.conversionRate,
  });

  try {
    const newCurrency = await currency.save();
    res.status(201).json(newCurrency);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an existing currency
router.put('/:id', getCurrency, async (req, res) => {
  if (req.body.name != null) {
    res.currency.name = req.body.name;
  }
  if (req.body.symbol != null) {
    res.currency.symbol = req.body.symbol;
  }
  if (req.body.tag != null) {
    res.currency.tag = req.body.tag;
  }
  if (req.body.conversionRate != null) {
    res.currency.conversionRate = req.body.conversionRate;
  }

  try {
    const updatedCurrency = await res.currency.save();
    res.json(updatedCurrency);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a currency
router.delete('/:id', getCurrency, async (req, res) => {
  try {
    await res.currency.deleteOne();  // Updated line
    res.json({ message: 'Currency deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to get a currency by ID
async function getCurrency(req, res, next) {
  let currency;
  try {
    currency = await Currency.findById(req.params.id);
    if (currency == null) {
      return res.status(404).json({ message: 'Currency not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.currency = currency;
  next();
}

module.exports = router;
