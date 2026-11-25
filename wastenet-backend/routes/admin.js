const express = require('express');
const Complaint = require('../models/Complaint');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    // Count by status
    const statusCounts = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byStatus = { pending: 0, 'in-progress': 0, resolved: 0 };
    statusCounts.forEach((s) => {
      if (byStatus.hasOwnProperty(s._id)) byStatus[s._id] = s.count;
    });

    // Count by category
    const categoryCounts = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const byCategory = {
      'overflowing bin': 0,
      'illegal dumping': 0,
      'plastic waste': 0,
      'e-waste': 0,
      hazardous: 0,
      other: 0,
    };
    categoryCounts.forEach((c) => {
      if (byCategory.hasOwnProperty(c._id)) byCategory[c._id] = c.count;
    });

    // Complaints per day for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const perDayRaw = await Complaint.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const complaintsPerDay = perDayRaw.map((d) => ({ date: d._id, count: d.count }));

    // Average resolution time in hours
    const resolutionData = await Complaint.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $exists: true, $ne: null } } },
      {
        $project: {
          diffMs: { $subtract: ['$resolvedAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgMs: { $avg: '$diffMs' },
        },
      },
    ]);
    const avgResolutionHours =
      resolutionData.length > 0
        ? Math.round((resolutionData[0].avgMs / (1000 * 60 * 60)) * 100) / 100
        : null;

    res.json({
      byStatus,
      byCategory,
      complaintsPerDay,
      avgResolutionHours,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
