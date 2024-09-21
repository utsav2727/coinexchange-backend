const express = require('express');
const router = express.Router();
const Config = require('../model/Configuration'); // Import the Config model

// Create a new configuration
router.post('/', async (req, res) => {
  try {
    const { buylimit, sellLimit } = req.body;

    const config = new Config({
      buylimit,
      sellLimit,
    });

    const newConfig = await config.save();
    res.status(201).json(newConfig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all configurations
router.get('/', async (req, res) => {
  try {
    const configs = await Config.find();
    res.status(200).json(configs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single configuration by ID
router.get('/:id', async (req, res) => {
  try {
    const config = await Config.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'Config not found' });
    }
    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a configuration by ID
router.put('/:id', async (req, res) => {
  try {
    const { buylimit, sellLimit } = req.body;

    const config = await Config.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'Config not found' });
    }

    config.buylimit = buylimit !== undefined ? buylimit : config.buylimit;
    config.sellLimit = sellLimit !== undefined ? sellLimit : config.sellLimit;
    config.updatedAt = Date.now();

    const updatedConfig = await config.save();
    res.status(200).json(updatedConfig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a configuration by ID
router.delete('/:id', async (req, res) => {
  try {
    const config = await Config.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'Config not found' });
    }

    await config.remove();
    res.status(200).json({ message: 'Config deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
