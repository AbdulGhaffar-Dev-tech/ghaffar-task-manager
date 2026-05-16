import React, { useState, useEffect } from 'react';
import { createTask, updateTask } from '../services/api';
import { toast } from 'react-toastify';

export default function TaskForm({ task, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pending',
    difficulty: 'Low', 
    dueDate: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Pending',
        difficulty: task.difficulty || 'Low', 
        // ✅ Extracts exactly YYYY-MM-DD so HTML input doesn't render a blank string
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
    }
  }, [task]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare clean data payload
    const taskData = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      difficulty: formData.difficulty,
      // ✅ Explicitly set to null if empty so MongoDB and express-validator accept it safely
      dueDate: formData.dueDate || null 
    };

    try {
      if (task && task._id) {
        await updateTask(task._id, taskData);
      } else {
        await createTask(taskData);
      }
      onSaved(); 
    } catch (error) {
      console.error("Save failed", error);
      const errorMsg = error.response?.data?.message || "Error saving task. Check backend connection.";
      toast.error(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-main)' }}>
        {task ? 'Edit Task' : 'Create New Task'}
      </h2>
      <p className="text-sm opacity-60 mb-6" style={{ color: 'var(--text-muted)' }}>
        Fill in the details below to organize your workflow.
      </p>
      
      <div className="task-form-grid">
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

        <div className="form-group">
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block opacity-70">Status</label>
          <select name='status' value={formData.status} onChange={handleChange} className="w-full">
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="form-group">
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block opacity-70">Due Date</label>
          {/* ✅ Handled safe reading of value strings directly inside standard date selector layouts */}
          <input 
            type='date' 
            name='dueDate' 
            value={formData.dueDate} 
            onChange={handleChange} 
            className="w-full" 
          />
        </div>

        {/* --- DIFFICULTY SELECTION LEVEL BLOCK --- */}
        <div className="form-group full-width mt-2">
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block opacity-70">Task Difficulty</label>
          <div className="flex gap-3">
            {['Low', 'Medium', 'High'].map((level) => {
              const isSelected = formData.difficulty === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: level })}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all duration-200 border-2 ${
                    isSelected 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]' 
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 opacity-60 hover:opacity-100'
                  }`}
                >
                  ⚡ {level}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className='flex gap-4 justify-end mt-10'>
        <button type='button' onClick={onClose} className="px-6 py-2 font-semibold text-slate-500 hover:text-red-500 transition-colors">
          Discard
        </button>
        <button type='submit' className='btn-primary px-10 py-3 rounded-xl shadow-indigo-500/20 shadow-xl'>
          {task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}