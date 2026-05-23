const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User'); 
const { body, validationResult } = require('express-validator');

// Destructure the imports from the object exported in auth.js
const { authMiddleware, transporter } = require('./auth');

// Validation rules
const taskValidation = [
  body('title').notEmpty().withMessage('Title is required').trim(),
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed']) 
    .withMessage('Invalid status value'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
];

// --- 1. SHARE TASK (Authorized Admins Only) ---
router.put('/:id/share', authMiddleware, async (req, res) => {
  try {
    const { emailToShareWith } = req.body;
    
    // Check if the logged-in user is an Admin (Role Authorization)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Access Denied: Only Admins are allowed to share tasks." 
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Ensure the admin is the OWNER of the task (Ownership Authorization)
    if (task.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access Denied: You can only share tasks you created." });
    }

   const recipient = await User.findOne({ email: { $regex: `^${emailToShareWith}$`, $options: 'i' } });
    if (!recipient) return res.status(404).json({ message: "Recipient user not found." });

    // Prevent sharing with yourself
    if (recipient._id.toString() === req.user.id) {
        return res.status(400).json({ message: "You cannot share a task with yourself." });
    }

    // Perform sharing logic
    if (!task.sharedWith.includes(recipient._id)) {
      task.sharedWith.push(recipient._id);
      await task.save();

      // REAL-TIME NOTIFICATION (Socket.io)
      if (req.io) {
        req.io.to(recipient._id.toString()).emit('notification', {
          message: `${req.user.name} shared a task with you: "${task.title}"`,
          type: 'TASK_SHARED'
        });
      }

      // EMAIL NOTIFICATION (Nodemailer)
      try {
        await transporter.sendMail({
          from: '"Task Manager Admin" <um1697170@gmail.com>',
          to: emailToShareWith,
          subject: 'A task has been shared with you!',
          text: `Hello ${recipient.name}, Admin ${req.user.name} shared a task: "${task.title}".`
        });
      } catch (mailErr) {
        console.error("Email failed but database updated:", mailErr.message);
      }
    }

    res.json({ message: "Task shared successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during sharing" });
  }
});

// --- 2. GET ALL TASKS (Owner or Collaborator) ---
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, status } = req.query;
    
    // Core Authorization Base Filter
    const filter = {
      $and: [
        {
          $or: [
            { owner: req.user.id },
            { sharedWith: req.user.id }
          ]
        }
      ]
    };

    if (status) {
      filter.status = status;
    }

    // ✅ FIXED ROOT CAUSE: Separated search logic so it doesn't smash or override permissions
    if (search) {
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("Fetch tasks error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 3. CREATE TASK ---
router.post('/', authMiddleware, taskValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, status, difficulty, dueDate } = req.body;

    const newTask = new Task({
      title,
      description,
      status,
      difficulty,
      dueDate: dueDate || null, // Ensure a clean value or null gets committed cleanly
      owner: req.user.id 
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error("Creation Save Error:", err);
    res.status(400).json({ message: "Error saving task" });
  }
});

// --- 4. UPDATE TASK (Authorized Owner or Collaborator) ---
router.put('/:id', authMiddleware, taskValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // AUTH CHECK: Is user owner OR in sharedWith?
    const isOwner = task.owner.toString() === req.user.id;
    const isCollaborator = task.sharedWith.includes(req.user.id);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Access Denied: You are not authorized to edit this task." });
    }

    const { title, description, status, difficulty, dueDate } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id, 
      {
        title,
        description,
        status,
        difficulty,
        dueDate: dueDate !== undefined ? dueDate : task.dueDate
      }, 
      { new: true }
    );
    
    // REAL-TIME NOTIFICATION: Notify owner if a collaborator changes status
    if (isCollaborator && status && req.io && !isOwner) {
        req.io.to(task.owner.toString()).emit('notification', {
            message: `${req.user.name} updated the status of "${task.title}" to ${status}`,
            type: 'STATUS_UPDATE'
        });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error("Update route error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/shared-with-me', authMiddleware, async (req, res) => {
  try {
    const sharedTasks = await Task.find({ sharedWith: req.user.id })
      .populate('owner', 'name email');
    res.json(sharedTasks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching shared tasks" });
  }
});

// --- 5. DELETE TASK (Authorized Owners Only) ---
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // AUTH CHECK: Strictly Owner Only
    if (task.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access Denied: Only the owner can delete this task." });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;