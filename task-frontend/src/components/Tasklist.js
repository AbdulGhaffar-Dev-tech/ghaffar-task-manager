import { useEffect, useState } from 'react';
import { getAllTasks, deleteTask, shareTask } from '../services/api'; 
import TaskForm from './TaskForm';
import ProgressBar from './ProgressBar';
import SearchBar from './SearchBar';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

// 🔥 FIX 1: Dynamic Production-Ready Sockets URL string mapping
const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://task-manager-production-30e0.up.railway.app';

export default function TaskList() {
  const [tasks, setTasks] = useState([]); 
  const [filteredTasks, setFilteredTasks] = useState([]); 
  const [editing, setEditing] = useState(null); 
  const [showModal, setShowModal] = useState(false);

  const userData = JSON.parse(localStorage.getItem('user'));
  const isAdmin = userData?.role === 'admin';
  const currentUserId = userData?.id || userData?._id || userData?.user?.id || userData?.user?._id;

  const fetchTasks = async () => {
    try {
      const { data } = await getAllTasks(); 
      setTasks(data);
      setFilteredTasks(data);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load tasks.");
    }
  };

  useEffect(() => {
    fetchTasks();

    let socketInstance = null;
    if (currentUserId) {
      // Use clean production endpoints with accurate routing options wrappers
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        secure: true
      });
      
      socketInstance.emit('join', String(currentUserId).trim());

      socketInstance.on('notification', (data) => {
        if (data.type === 'TASK_SHARED' || data.type === 'TASK_EDITED') {
          fetchTasks(); 
        }
      });
    }

    return () => {
      if (socketInstance) {
        socketInstance.off('notification');
        socketInstance.disconnect();
      }
    };
  }, [currentUserId]);

  // 🔥 FIX 2: Added absolute sanitization guards on user prompt input collections
  const handleShare = async (taskId) => {
    const rawEmail = window.prompt("Enter the email of the user to share this task with:");
    if (!rawEmail) return;
    
    const cleanEmail = rawEmail.trim(); // Remove leading/trailing spaces instantly

    try {
      // Hits your backend router smoothly with structured variable name configuration mapping
      await shareTask(taskId, cleanEmail);
      toast.success(`Task shared with ${cleanEmail}! ✉️`);
      fetchTasks();
    } catch (err) {
      console.error("Task sharing trace debug object:", err.response);
      toast.error(err.response?.data?.message || "Failed to share task.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        toast.error("Task removed 🗑️");
        fetchTasks();
      } catch (err) { toast.error("Error deleting task"); }
    }
  };

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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getDifficultyStyle = (difficulty) => {
    switch (difficulty) {
      case 'High': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'Medium': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <ProgressBar tasks={tasks} />
      
      <div className='flex justify-between items-center mb-6'>
        <div className="flex flex-col">
          <h1 className='text-3xl font-bold tracking-tight' style={{ color: 'var(--text-main)' }}>My Tasks</h1>
          {isAdmin && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Administrator Mode</span>}
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className='btn-primary'>
          + New Task
        </button>
      </div>

      <SearchBar onSearch={handleSearch} onFilter={handleFilter} />

      <div className='space-y-4 mt-6'>
        {filteredTasks.map((task, index) => {
          const taskOwnerId = task.owner?.id || task.owner?._id || task.owner;
          const isOwner = taskOwnerId?.toString() === currentUserId?.toString();
          const isCollaborator = task.sharedWith?.some(id => (id._id || id).toString() === currentUserId?.toString());
          const canEdit = isOwner || isCollaborator;

          return (
            <div key={task._id} className='task-card' style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-main)' }}>
                    {task.title}
                  </h3>
                  {isCollaborator && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 border border-indigo-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      Shared with me
                    </span>
                  )}
                </div>
                <p className='text-sm mb-3' style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusStyle(task.status)}`}>
                    {task.status || 'Pending'}
                  </span>

                  {task.difficulty && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getDifficultyStyle(task.difficulty)}`}>
                      ⚡ {task.difficulty}
                    </span>
                  )}

                  {task.dueDate && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      📅 Due: {new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div className='flex gap-2 ml-4 items-center'>
                {isAdmin && isOwner && (
                  <button onClick={() => handleShare(task._id)} className='btn-share text-sm'>
                    <span className="mr-1">✉</span> Share
                  </button>
                )}
                {canEdit ? (
                  <button onClick={() => { setEditing(task); setShowModal(true); }} className='btn-edit text-sm'>
                    Edit
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-400 italic">View Only</span>
                )}
                {isOwner && (
                  <button onClick={() => handleDelete(task._id)} className='btn-delete text-sm'>
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
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
                toast.success(editing ? "Changes saved! ✅" : "Task added! 🚀");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}