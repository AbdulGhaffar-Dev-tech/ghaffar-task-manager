const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User'); 
const { body, validationResult } = require('express-validator');

// Importing authentication middleware and email transporter for notifications
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

// --- 1. SHARE TASK (Authorized Owners Only + Strict Non-Existence Check) ---
router.put('/:id/share', authMiddleware, async (req, res) => {
  try {
    let email = null;

    // 🔍 DEEP PACKET SCANNER: Automatically scans all keys sent by the frontend
    if (req.body && typeof req.body === 'object') {
      // 1. Check direct keys first (Added emailToShareWith here!)
      email = req.body.email || 
              req.body.emailToShareWith || 
              req.body.recipientEmail || 
              req.body.emailToShare;

      // 2. Fallback: Loop through keys dynamically to find any string containing an '@' symbol
      if (!email) {
        const keys = Object.keys(req.body);
        for (let key of keys) {
          const value = req.body[key];
          if (typeof value === 'string' && value.includes('@')) {
            email = value;
            break;
          }
        }
      }
    }

    // 3. Fallback: Check URL query parameters just in case (?email=...)
    if (!email && req.query) {
      email = req.query.email || req.query.recipientEmail;
    }

    // 🛑 If absolutely nothing was found, reject with complete debug tools
    if (!email) {
      console.error("❌ CRITICAL SCRIPT ALERT: Frontend payload received was empty or unrecognizable:", req.body);
      return res.status(400).json({ 
        message: "Recipient email is required.",
        debug_info: {
          received_body: req.body,
          received_query: req.query,
          content_type: req.headers['content-type']
        }
      });
    }

    // FORCE ADMIN ACCESS FOR YOUR PRODUCTION ACCOUNT EMAIL
    const isSystemAdmin = req.user.role === 'admin';
    const isYourEmail = req.user.email && req.user.email.toLowerCase().trim() === 'muhammdaslamm9977@gmail.com';

    if (!isSystemAdmin && !isYourEmail) {
      return res.status(403).json({ 
        message: "Access Denied: Only Admins are allowed to share tasks." 
      });
    }

    // Sanitize input: strip hidden edge spaces and force lowercase
    const sanitizedEmail = email.trim().toLowerCase();

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // High performance direct lookup first
    let recipient = await User.findOne({ email: sanitizedEmail });
    
    // Defensive fallback: If direct match misses, search case-insensitively via regex bounds
    if (!recipient) {
      recipient = await User.findOne({ email: { $regex: `^${sanitizedEmail}$`, $options: 'i' } });
    }

    // 🛑 STRICT CHECK: If the recipient doesn't exist, return an explicit error response
    if (!recipient) {
      return res.status(404).json({ message: "User does not exist" });
    }

    // Prevent sharing with yourself
    if (recipient._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot share a task with yourself." });
    }

    // Ensure sharedWith exists as an array array to prevent mapping pointer faults
    if (!task.sharedWith) {
      task.sharedWith = [];
    }

    // Map ObjectIds safely to strings for an accurate presence lookup array check
    const sharedWithIds = task.sharedWith.map(id => id.toString());

    if (!sharedWithIds.includes(recipient._id.toString())) {
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
          to: recipient.email,
          subject: 'A task has been shared with you!',
          text: `Hello ${recipient.name}, Admin ${req.user.name} shared a task: "${task.title}".`
        });
      } catch (mailErr) {
        console.error("❌ Email transmission failed but database saved successfully:", mailErr.message);
      }
    }

    res.json({ message: "Task shared successfully" });
  } catch (err) {
    console.error("💥 Error during task sharing route execution:", err);
    res.status(500).json({ message: "Server error during sharing" });
  }
});

// --- 2. GET ALL TASKS (Owner or Collaborator - FIX 500 LOAD TASK ISSUE) ---
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Structural Guard: Validate if user contextual parameter exists from auth token
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Missing identity payload parameter context" });
    }

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

    // Query safely inside isolated $and index bounds so visibility parameters are preserved
    if (search) {
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks || []); // Always fallback to an empty array instead of null breaking frontend templates
  } catch (err) {
    console.error("💥 Fetch tasks terminal dump error:", err);
    res.status(500).json({ message: 'Server error loading task collection documents', error: err.message });
  }
});

// --- 3. CREATE TASK (FIX 400 ERROR VALIDATION LOGGER) ---
router.post('/', authMiddleware, taskValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // 🪵 EXPLICIT LOGS: Prints the exact reason why the frontend validation field failed 
    console.error("❌ TASK CREATE VALIDATION FAILED! Structural log list:", errors.array());
    console.log("📦 Received body structure payload context was:", req.body);
    return res.status(400).json({ message: "Validation validation constraints failed", errors: errors.array() });
  }

  try {
    const { title, description, status, difficulty, dueDate } = req.body;

    const newTask = new Task({
      title: title.trim(),
      description: description || '',
      status: status || 'Pending',
      difficulty: difficulty || 'Medium',
      dueDate: dueDate || null, 
      owner: req.user.id 
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error("💥 Creation Save Error inside database container stream:", err);
    res.status(500).json({ message: "Internal Server database block error saving task documentation profile", error: err.message });
  }
});

// --- 4. UPDATE TASK (Authorized Owner or Collaborator) ---
router.put('/:id', authMiddleware, taskValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // AUTH CHECK: Is user owner OR in sharedWith array?
    const isOwner = task.owner.toString() === req.user.id;
    const isCollaborator = task.sharedWith && task.sharedWith.map(id => id.toString()).includes(req.user.id);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Access Denied: You are not authorized to edit this task." });
    }

    const { title, description, status, difficulty, dueDate } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id, 
      {
        title: title ? title.trim() : task.title,
        description: description !== undefined ? description : task.description,
        status: status !== undefined ? status : task.status,
        difficulty: difficulty !== undefined ? difficulty : task.difficulty,
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
    console.error("💥 Update route error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 5. GET SHARED TASKS ---
router.get('/shared-with-me', authMiddleware, async (req, res) => {
  try {
    const sharedTasks = await Task.find({ sharedWith: req.user.id })
      .populate('owner', 'name email');
    res.json(sharedTasks || []);
  } catch (err) {
    console.error("💥 Error fetching shared tasks:", err);
    res.status(500).json({ message: "Error fetching shared tasks" });
  }
});

// --- 6. DELETE TASK (Authorized Owners Only) ---
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
    console.error("💥 Delete failed:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;