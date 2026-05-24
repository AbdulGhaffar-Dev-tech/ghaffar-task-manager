import React, { useState, useEffect, useRef } from 'react';
import { createTask, updateTask, uploadAttachments, deleteAttachment } from '../services/api';
import { toast } from 'react-toastify';

// Helper: human-readable file size
const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper: is the file an image?
const isImage = (mimeType = '') => mimeType.startsWith('image/');

// File icon based on mime type
const FileIcon = ({ mimeType }) => {
  if (isImage(mimeType)) return <span>🖼️</span>;
  if (mimeType === 'application/pdf') return <span>📄</span>;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <span>📊</span>;
  if (mimeType.includes('word') || mimeType.includes('document')) return <span>📝</span>;
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return <span>🗜️</span>;
  return <span>📎</span>;
};

export default function TaskForm({ task, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pending',
    difficulty: 'Low',
    dueDate: ''
  });

  // Existing saved attachments (from DB)
  const [savedAttachments, setSavedAttachments] = useState([]);
  // New files staged for upload (File objects)
  const [pendingFiles, setPendingFiles] = useState([]);
  // Preview URLs for pending files
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Pending',
        difficulty: task.difficulty || 'Low',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
      setSavedAttachments(task.attachments || []);
    }
  }, [task]);

  // Generate object-URL previews for staged files
  useEffect(() => {
    const urls = pendingFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      preview: isImage(f.type) ? URL.createObjectURL(f) : null
    }));
    setPreviews(urls);
    return () => urls.forEach(u => u.preview && URL.revokeObjectURL(u.preview));
  }, [pendingFiles]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const chosen = Array.from(e.target.files);
    if (!chosen.length) return;
    const MAX = 10 * 1024 * 1024;
    const oversized = chosen.filter(f => f.size > MAX);
    if (oversized.length) {
      toast.error(`${oversized.map(f => f.name).join(', ')} exceed the 10 MB limit.`);
      return;
    }
    setPendingFiles(prev => [...prev, ...chosen]);
    // Reset input so the same file can be re-selected if removed
    e.target.value = '';
  };

  const removePending = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteSaved = async (attachmentId) => {
    if (!task?._id) return;
    try {
      const { data } = await deleteAttachment(task._id, attachmentId);
      setSavedAttachments(data.attachments);
      toast.success('Attachment removed.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete attachment.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const taskData = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      difficulty: formData.difficulty,
      dueDate: formData.dueDate || null
    };

    try {
      let savedTask;
      if (task && task._id) {
        const { data } = await updateTask(task._id, taskData);
        savedTask = data;
      } else {
        const { data } = await createTask(taskData);
        savedTask = data;
      }

      // Upload any staged files after the task is saved/created
      if (pendingFiles.length > 0) {
        setUploading(true);
        try {
          await uploadAttachments(savedTask._id, pendingFiles);
          toast.success(`${pendingFiles.length} file(s) uploaded! 📎`);
        } catch (uploadErr) {
          toast.error(uploadErr.response?.data?.message || 'File upload failed.');
        } finally {
          setUploading(false);
        }
      }

      onSaved();
    } catch (error) {
      console.error('Save failed', error);
      const errorMsg = error.response?.data?.message || 'Error saving task. Check backend connection.';
      toast.error(errorMsg);
    }
  };

  const totalAttachments = savedAttachments.length + pendingFiles.length;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-main)' }}>
        {task ? 'Edit Task' : 'Create New Task'}
      </h2>
      <p className="text-sm opacity-60 mb-6" style={{ color: 'var(--text-muted)' }}>
        Fill in the details below to organize your workflow.
      </p>

      <div className="task-form-grid">
        {/* Title */}
        <div className="form-group full-width">
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block opacity-70">Task Title</label>
          <input
            name='title'
            value={formData.title}
            onChange={handleChange}
            placeholder='e.g. Design Landing Page'
            required
            className="w-full"
          />
        </div>

        {/* Description */}
        <div className="form-group full-width">
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block opacity-70">Description</label>
          <textarea
            name='description'
            value={formData.description}
            onChange={handleChange}
            placeholder='Add more details...'
            rows="3"
            className="w-full"
          />
        </div>

        {/* Status */}
        <div className="form-group">
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block opacity-70">Status</label>
          <select name='status' value={formData.status} onChange={handleChange} className="w-full">
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Due Date */}
        <div className="form-group">
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block opacity-70">Due Date</label>
          <input
            type='date'
            name='dueDate'
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        {/* Difficulty */}
        <div className="form-group full-width mt-2">
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block opacity-70">Task Difficulty</label>
          <div className="difficulty-selector">
            {['Low', 'Medium', 'High'].map((level) => {
              const isSelected = formData.difficulty === level;
              const colorMap = {
                Low: isSelected ? 'difficulty-low-active' : 'difficulty-low',
                Medium: isSelected ? 'difficulty-medium-active' : 'difficulty-medium',
                High: isSelected ? 'difficulty-high-active' : 'difficulty-high',
              };
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: level })}
                  className={`difficulty-btn ${colorMap[level]}`}
                >
                  ⚡ {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Attachments ── */}
        <div className="form-group full-width">
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block opacity-70">
            Attachments
            {totalAttachments > 0 && (
              <span className="attachment-count-badge">{totalAttachments}</span>
            )}
          </label>

          {/* Drop-zone / file picker */}
          <div
            className="attachment-dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-over');
              const dropped = Array.from(e.dataTransfer.files);
              const MAX = 10 * 1024 * 1024;
              const oversized = dropped.filter(f => f.size > MAX);
              if (oversized.length) {
                toast.error(`${oversized.map(f => f.name).join(', ')} exceed the 10 MB limit.`);
                return;
              }
              setPendingFiles(prev => [...prev, ...dropped]);
            }}
          >
            <span className="attachment-dropzone-icon">📎</span>
            <span className="attachment-dropzone-text">
              Click or drag &amp; drop files here
            </span>
            <span className="attachment-dropzone-hint">
              Images, PDF, Word, Excel, ZIP — max 10 MB each
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Already-saved attachments */}
          {savedAttachments.length > 0 && (
            <div className="attachment-list">
              <p className="attachment-list-label">Saved files</p>
              {savedAttachments.map((att) => (
                <div key={att._id} className="attachment-item">
                  <div className="attachment-item-left">
                    {isImage(att.mimeType) ? (
                      <a href={att.url} target="_blank" rel="noreferrer">
                        <img src={att.url} alt={att.originalName} className="attachment-thumb" />
                      </a>
                    ) : (
                      <span className="attachment-file-icon"><FileIcon mimeType={att.mimeType} /></span>
                    )}
                    <div className="attachment-meta">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="attachment-name"
                        title={att.originalName}
                      >
                        {att.originalName}
                      </a>
                      <span className="attachment-size">{formatBytes(att.size)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="attachment-remove-btn"
                    onClick={() => handleDeleteSaved(att._id)}
                    title="Remove attachment"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pending (staged) files */}
          {pendingFiles.length > 0 && (
            <div className="attachment-list">
              <p className="attachment-list-label">Ready to upload</p>
              {previews.map((p, i) => (
                <div key={i} className="attachment-item attachment-item--pending">
                  <div className="attachment-item-left">
                    {p.preview ? (
                      <img src={p.preview} alt={p.name} className="attachment-thumb" />
                    ) : (
                      <span className="attachment-file-icon"><FileIcon mimeType={p.type} /></span>
                    )}
                    <div className="attachment-meta">
                      <span className="attachment-name" title={p.name}>{p.name}</span>
                      <span className="attachment-size">{formatBytes(p.size)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="attachment-remove-btn"
                    onClick={() => removePending(i)}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='form-actions-row flex gap-4 justify-end mt-8'>
        <button type='button' onClick={onClose} className="btn-discard">
          Discard
        </button>
        <button type='submit' disabled={uploading} className='btn-primary px-10 py-3 rounded-xl'>
          {uploading ? 'Uploading…' : task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}