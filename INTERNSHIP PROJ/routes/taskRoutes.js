const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User'); 
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Destructure the imports from the object exported in auth.js
const { authMiddleware, transporter } = require('./auth');

// --- MULTER CONFIGURATION ---
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt|zip|csv/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  allowed.test(ext) ? cb(null, true) : cb(new Error('File type not allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB cap
});

// Validation rules
const taskValidation = [
  body('title').notEmpty().withMessage('Title is required').trim(),
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed']) 
    .withMessage('Invalid status value'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
];

// --- 1. SHARE TASK (Authorized Admins Only + Explicit Email Bypass) ---
router.post('/:id/share', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body; 
    
    // 👑 FORCE ADMIN ACCESS FOR YOUR PRODUCTION ACCOUNT EMAIL
    const isSystemAdmin = req.user.role === 'admin';
    const isYourEmail = req.user.email && req.user.email.toLowerCase().trim() === 'muhammdaslamm9977@gmail.com';

    if (!isSystemAdmin && !isYourEmail) {
      return res.status(403).json({ 
        message: "Access Denied: Only Admins are allowed to share tasks." 
      });
    }

    if (!email) {
      return res.status(400).json({ message: "Recipient email is required." });
    }

    // 🧼 Sanitize input: strip hidden edge spaces and force lowercase
    const sanitizedEmail = email.trim().toLowerCase();

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Ensure the admin is the OWNER of the task (Ownership Authorization)
    if (task.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access Denied: You can only share tasks you created." });
    }

    // High performance direct lookup first
    let recipient = await User.findOne({ email: sanitizedEmail });
    
    // Defensive fallback: If direct match misses, search case-insensitively via regex bounds
    if (!recipient) {
      recipient = await User.findOne({ email: { $regex: `^${sanitizedEmail}$`, $options: 'i' } });
    }

    if (!recipient) {
      return res.status(404).json({ message: "Recipient user not found." });
    }

    // Prevent sharing with yourself
    if (recipient._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot share a task with yourself." });
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
    res.json(tasks);
  } catch (err) {
    console.error("💥 Fetch tasks error:", err);
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
      dueDate: dueDate || null, 
      owner: req.user.id 
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error("💥 Creation Save Error:", err);
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

    // AUTH CHECK: Is user owner OR in sharedWith array?
    const isOwner = task.owner.toString() === req.user.id;
    const isCollaborator = task.sharedWith.map(id => id.toString()).includes(req.user.id);

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
    console.error("💥 Update route error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 5. GET SHARED TASKS ---
router.get('/shared-with-me', authMiddleware, async (req, res) => {
  try {
    const sharedTasks = await Task.find({ sharedWith: req.user.id })
      .populate('owner', 'name email');
    res.json(sharedTasks);
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

// --- 7. UPLOAD ATTACHMENTS TO A TASK ---
router.post('/:id/attachments', authMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isOwner = task.owner.toString() === req.user.id;
    const isCollaborator = task.sharedWith.map(id => id.toString()).includes(req.user.id);
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access Denied: You cannot add attachments to this task.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files were uploaded.' });
    }

    // Build the base URL dynamically from the request
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const newAttachments = req.files.map(file => ({
      originalName: file.originalname,
      storedName:   file.filename,
      mimeType:     file.mimetype,
      size:         file.size,
      url:          `${baseUrl}/uploads/${file.filename}`
    }));

    task.attachments.push(...newAttachments);
    await task.save();

    res.status(201).json({ message: 'Files uploaded successfully', attachments: task.attachments });
  } catch (err) {
    console.error('💥 Attachment upload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

// --- 8. DELETE AN ATTACHMENT FROM A TASK ---
router.delete('/:id/attachments/:attachmentId', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isOwner = task.owner.toString() === req.user.id;
    const isCollaborator = task.sharedWith.map(id => id.toString()).includes(req.user.id);
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access Denied: You cannot remove attachments from this task.' });
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });

    // Remove the physical file from disk
    const filePath = path.join(UPLOADS_DIR, attachment.storedName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    attachment.deleteOne();
    await task.save();

    res.json({ message: 'Attachment deleted successfully', attachments: task.attachments });
  } catch (err) {
    console.error('💥 Attachment delete error:', err);
    res.status(500).json({ message: 'Failed to delete attachment' });
  }
});

module.exports = router;