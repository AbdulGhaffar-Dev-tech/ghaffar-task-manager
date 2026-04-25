const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { body, validationResult } = require('express-validator');
// Validation rules (reusable)
const taskValidation = [
body('title').notEmpty().withMessage('Title is required').trim(),
body('status')
.optional()
.isIn(['Pending', 'In Progress', 'Completed'])
.withMessage('Invalid status value'),
body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
];
//  POST /api/tasks — Create a task 
router.post('/', taskValidation, async (req, res) => {
const errors = validationResult(req);
if (!errors.isEmpty()) {
return res.status(400).json({ errors: errors.array() });
}
try {
const task = await Task.create(req.body);
res.status(201).json(task);
} catch (err) {
res.status(500).json({ message: 'Server error', error: err.message });
}
});
//  GET /api/tasks — Fetch all tasks 
router.get('/', async (req, res) => {
try {
const tasks = await Task.find().sort({ createdAt: -1 });
res.json(tasks);
} catch (err) {
res.status(500).json({ message: 'Server error', error: err.message });
}
});
//  GET /api/tasks/:id — Fetch single task 
router.get('/:id', async (req, res) => {
try {
const task = await Task.findById(req.params.id);
if (!task) return res.status(404).json({ message: 'Task not found' });
res.json(task);
} catch (err) {
res.status(500).json({ message: 'Server error', error: err.message });
}
});
//  PUT /api/tasks/:id — Update a task 
router.put('/:id', taskValidation, async (req, res) => {
const errors = validationResult(req);
if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
try {
const task = await Task.findByIdAndUpdate(
req.params.id,
req.body,
{ new: true, runValidators: true }
);
if (!task) return res.status(404).json({ message: 'Task not found' });
res.json(task);
} catch (err) {
res.status(500).json({ message: 'Server error', error: err.message });
}
});
//  DELETE /api/tasks/:id — Delete a task 
router.delete('/:id', async (req, res) => {
try {
const task = await Task.findByIdAndDelete(req.params.id);
if (!task) return res.status(404).json({ message: 'Task not found' });
res.json({ message: 'Task deleted successfully' });
} catch (err) {
res.status(500).json({ message: 'Server error', error: err.message });
}
});
router.get('/', async (req, res) => {
try {
const { search, status } = req.query;
const filter = {};
if (status) filter.status = status;
if (search) {
filter.$or = [
{ title: { $regex: search, $options: 'i' } },
{ description: { $regex: search, $options: 'i' } },
];
}
const tasks = await Task.find(filter).sort({ createdAt: -1 });
res.json(tasks);
} catch (err) {
res.status(500).json({ message: 'Server error', error: err.message });
}
});

module.exports = router;