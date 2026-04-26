const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // MOVED: user must be its own top-level field
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, 'Task must belong to a user'] 
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    dueDate: {
      type: Date,
    },
    difficulty: { 
      type: String, 
      enum: ['Easy', 'Medium', 'Hard'], 
      default: 'Medium' 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);