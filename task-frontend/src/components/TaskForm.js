import { useState, useEffect } from 'react';
import { createTask, updateTask } from '../services/api';

export default function TaskForm({ task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'Pending',
    dueDate: '',
    difficulty: 'Medium',
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Pending',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        difficulty: task.difficulty || 'Medium',
      });
    }
  }, [task]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user'));
    
    if (!userData || !userData.id) {
      alert("Session expired. Please login again.");
      return;
    }

    // 2. Attach the user ID to the task data
    const taskData = { 
        ...form, 
        user: userData.id  // CRITICAL: Links the task to you
    };

    if (!taskData.dueDate) delete taskData.dueDate;

    try {
      if (task && task._id) {
        await updateTask(task._id, taskData);
      } else {
        await createTask(taskData);
      }
      // 3. Trigger refresh in TaskList
      onSaved(); 
    } catch (error) {
      console.error("Save failed", error);
      alert("Error saving task. Ensure your backend Task model includes the 'user' field.");
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
            value={form.title} 
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
            value={form.description} 
            onChange={handleChange} 
            placeholder='Add more details...' 
            rows="3"
            className="w-full"
          />
        </div>

        <div className="form-group">
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block opacity-70">Status</label>
          <select name='status' value={form.status} onChange={handleChange} className="w-full">
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="form-group">
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block opacity-70">Due Date</label>
          <input type='date' name='dueDate' value={form.dueDate} onChange={handleChange} className="w-full" />
        </div>

        <div className="form-group full-width">
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block opacity-70">Priority Level</label>
          <div className="flex gap-3">
            {['Easy', 'Medium', 'Hard'].map((level) => {
              const isSelected = form.difficulty === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm({ ...form, difficulty: level })}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all duration-200 border-2 ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-[1.02]' 
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 opacity-60 hover:opacity-100'
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className='flex gap-4 justify-end mt-10'>
        <button 
          type='button' 
          onClick={onClose} 
          className="px-6 py-2 font-semibold text-slate-500 hover:text-red-500 transition-colors"
        >
          Discard
        </button>
        <button 
          type='submit' 
          className='btn-primary px-10 py-3 rounded-xl shadow-indigo-500/20 shadow-xl'
        >
          {task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}