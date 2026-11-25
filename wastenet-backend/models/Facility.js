const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['recycling centre', 'scrap shop', 'waste-to-energy plant'],
    required: true,
  },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  contact: { type: String },
});

module.exports = mongoose.model('Facility', facilitySchema);
