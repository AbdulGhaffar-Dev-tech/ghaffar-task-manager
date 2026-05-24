const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  storedName:   { type: String, required: true },
  mimeType:     { type: String, required: true },
  size:         { type: Number, required: true },
  url:          { type: String, required: true },
  uploadedAt:   { type: Date, default: Date.now }
}, { _id: true });

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  difficulty: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  dueDate: { type: Date },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attachments: [AttachmentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);