const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String },
    note: { type: String },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    photoUrl: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved'],
      default: 'pending',
    },
    category: {
      type: String,
      enum: ['overflowing bin', 'illegal dumping', 'plastic waste', 'e-waste', 'hazardous', 'other'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    address: { type: String },
    statusHistory: { type: [statusHistorySchema], default: [] },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
