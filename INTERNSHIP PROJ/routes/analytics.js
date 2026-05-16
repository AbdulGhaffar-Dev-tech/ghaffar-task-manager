const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const { authMiddleware } = require('./auth'); 

// @route   GET /api/analytics/overview
// @desc    Get total tasks, status, and priority metrics using a high-performance facet pipeline
router.get('/overview', authMiddleware, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const analytics = await Task.aggregate([
            // Match only the tasks belonging to the authenticated user
            { $match: { owner: userId } },
            
            // Execute multiple aggregations down separate paths in a single execution loop
            {
                $facet: {
                    statusBreakdown: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    priorityBreakdown: [
                        { $group: { _id: "$priority", count: { $sum: 1 } } }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const result = analytics[0];
        const total = result.totalCount[0] ? result.totalCount[0].count : 0;

        res.json({
            totalTasks: total,
            statusBreakdown: result.statusBreakdown || [],
            priorityBreakdown: result.priorityBreakdown || []
        });

    } catch (err) {
        console.error('❌ Backend Analytics Error:', err);
        res.status(500).json({ message: 'Server error pulling structural metrics.' });
    }
});

// @route   GET /api/analytics/trends
// @desc    Get historical time-series metrics tracking creation and completion rates (Daily)
router.get('/trends', authMiddleware, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const trends = await Task.aggregate([
            { $match: { owner: userId } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    created: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id": 1 } }, 
            { $limit: 7 } 
        ]);

        res.json(trends);
    } catch (err) {
        console.error('❌ Backend Trends Error:', err);
        res.status(500).json({ message: 'Server error pulling chronological metrics.' });
    }
});

// @route   GET /api/analytics/monthly
// @desc    Get monthly historical trends tracking creation and completion rates
router.get('/monthly', authMiddleware, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const monthlyTrends = await Task.aggregate([
            // Match only the tasks belonging to the authenticated user
            { $match: { owner: userId } },
            
            // Group tasks by year and month (%Y-%m format)
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    created: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id": 1 } }, // Sort chronologically (Jan, Feb, Mar...)
            { $limit: 12 } // Show up to the last 12 months
        ]);

        res.json(monthlyTrends);
    } catch (err) {
        console.error('❌ Backend Monthly Trends Error:', err);
        res.status(500).json({ message: 'Server error pulling monthly metrics.' });
    }
});

module.exports = router;