import { useEffect, useState } from 'react';
import { getAllTasks, deleteTask } from '../services/api';
import TaskForm from './TaskForm';
import ProgressBar from './ProgressBar';
import SearchBar from './SearchBar';
import { toast } from 'react-toastify';

export default function TaskList() {
  const [tasks, setTasks] = useState([]); 
  const [filteredTasks, setFilteredTasks] = useState([]); 
  const [editing, setEditing] = useState(null); 
  const [showModal, setShowModal] = useState(false);

  const fetchTasks = async () => {
    try {
      // 1. Get the user data from localStorage (stored during login)
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (!userData || !userData.id) {
        toast.error("User session expired. Please login again.");
        return;
      }

      // 2. Pass the userId to your API helper
      const { data } = await getAllTasks(userData.id); 
      
      setTasks(data);
      setFilteredTasks(data);
    } catch (err) {
      toast.error("Failed to load tasks");
    }
  };
  // Add this inside TaskList function, before the return statement
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'Hard': return 'text-red-500';
      case 'Medium': return 'text-amber-500';
      case 'Easy': return 'text-emerald-500';
      default: return 'text-gray-400';
    }
  };

  useEffect(() => { 
    fetchTasks(); 
  }, []);

  const handleSearch = (term) => {
    const filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(term.toLowerCase()) ||
      task.description?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredTasks(filtered);
  };

  const handleFilter = (status) => {
    status === '' ? setFilteredTasks(tasks) : setFilteredTasks(tasks.filter(t => t.status === status));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        toast.error("Task removed permanently 🗑️", { position: "bottom-right", theme: "colored" });
        fetchTasks();
      } catch (err) { toast.error("Error deleting task"); }
    }
  };

  // ... (Keep getStatusStyle and getDifficultyColor the same)

  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <ProgressBar tasks={tasks} />
      
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold tracking-tight' style={{ color: 'var(--text-main)' }}>My Tasks</h1>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className='btn-primary'>
          + New Task
        </button>
      </div>

      <SearchBar onSearch={handleSearch} onFilter={handleFilter} />

      <div className='space-y-4 mt-6'>
        {filteredTasks.map((task, index) => (
          <div key={task._id} className='task-card' style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="flex-1">
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='font-bold text-lg' style={{ color: 'var(--text-main)' }}>{task.title}</h3>
                <span className={`text-[10px] font-black ${getDifficultyColor(task.difficulty)}`}>
                  {task.difficulty === 'Hard' ? '●●●' : task.difficulty === 'Medium' ? '●●' : '●'}
                </span>
              </div>
              <p className='text-sm mb-3' style={{ color: 'var(--text-muted)' }}>{task.description}</p>
              
              <div className="flex gap-3 items-center">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusStyle(task.status)}`}>
                  {task.status}
                </span>
                {task.dueDate && (
                  <span className="text-xs font-medium text-indigo-500 flex items-center gap-1">
                    📅 {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className='flex gap-3 ml-4 items-center'>
              <button onClick={() => { setEditing(task); setShowModal(true); }} className='btn-edit text-sm'>Edit</button>
              <button onClick={() => handleDelete(task._id)} className='btn-delete text-sm'>Delete</button>
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-20 opacity-50"><p className="text-xl">No tasks found</p></div>
        )}
      </div>

      {showModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <TaskForm
              task={editing}
              onClose={() => setShowModal(false)}
              onSaved={() => { 
                fetchTasks(); 
                setShowModal(false); 
                toast.success(editing ? "Changes saved! ✅" : "Task added! 🚀", { position: "bottom-right", theme: "colored" });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}