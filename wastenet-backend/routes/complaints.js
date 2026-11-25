const express = require('express');
const multer = require('multer');
const Complaint = require('../models/Complaint');
const supabase = require('../config/supabase');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const VALID_CATEGORIES = ['overflowing bin', 'illegal dumping', 'plastic waste', 'e-waste', 'hazardous', 'other'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// PUBLIC: list complaints (no auth) with pagination & filtering
router.get('/public', async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    if (limit > 50) limit = 50;
    if (page < 1) page = 1;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Complaint.countDocuments(filter);
    const pages = Math.ceil(total / limit);
    const complaints = await Complaint.find(filter)
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Also return total resolved for the homepage counter
    const totalResolved = await Complaint.countDocuments({ status: 'resolved' });

    res.json({ complaints, total, page, pages, resolved: totalResolved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// citizen: see my own complaints
router.get('/mine', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// admin: see all complaints
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// citizen: report a new complaint
router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    const { description, lat, lng, category, priority, address } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Photo is required' });
    }
    if (!description || !lat || !lng) {
      return res.status(400).json({ message: 'Description and location are required' });
    }
    if (description.length < 10 || description.length > 500) {
      return res.status(400).json({ message: 'Description must be between 10 and 500 characters' });
    }
    if (isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({ message: 'lat and lng must be valid numbers' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const fileName = Date.now() + '-' + req.file.originalname.replace(/\s+/g, '-');

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (error) {
      return res.status(500).json({ message: 'Photo upload failed: ' + error.message });
    }

    const { data } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    const complaint = await Complaint.create({
      user: req.user.id,
      description,
      photoUrl: data.publicUrl,
      lat: Number(lat),
      lng: Number(lng),
      category,
      priority: priority || 'medium',
      address: address || undefined,
      statusHistory: [{ status: 'pending', note: 'Complaint submitted', changedAt: new Date() }],
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// admin: change status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!['pending', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const historyEntry = { status, note: note || '', changedAt: new Date() };

    const updateFields = {
      status,
      $push: { statusHistory: historyEntry },
    };

    if (status === 'resolved') {
      updateFields.resolvedAt = new Date();
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate('user', 'name');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// logged-in user: get single complaint (citizen sees own, admin sees any)
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('user', 'name');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && complaint.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this complaint' });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// delete complaint: citizen can delete own if pending; admin can delete any
router.delete('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role === 'admin') {
      await complaint.deleteOne();
      return res.json({ message: 'Complaint deleted' });
    }

    if (complaint.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this complaint' });
    }

    if (complaint.status !== 'pending') {
      return res.status(400).json({ message: 'You can only delete a complaint that is still pending' });
    }

    await complaint.deleteOne();
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
