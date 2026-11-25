const express = require('express');
const Facility = require('../models/Facility');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// anyone can view facilities (used by the map)
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json(facilities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// admin: add a facility
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
    res.status(201).json(facility);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
