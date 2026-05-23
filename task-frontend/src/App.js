import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import TaskList from './components/TaskList'; 
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword'; 
import Login from './components/Login';
import Signup from './components/Signup';
import AnalyticsDashboard from './components/AnalyticsDashboard'; 
import { ToastContainer, toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import io from 'socket.io-client';

// ✅ ULTIMATE FIX: Uses a relative path in production so it automatically matches your active browser domain!
const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000' 
  : window.location.origin; // 🚀 Automatically becomes 'https://ghaffar-task-manager-production.up.railway.app' on live web browsers

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  secure: true,
  withCredentials: true
});

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // Apply the active theme class directly to the HTML document wrapper
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  // --- SOCKET.IO REAL-TIME NOTIFICATIONS SETUP ---
  useEffect(() => {
    if (isLoggedIn) {
      const userData = JSON.parse(localStorage.getItem('user'));
      const actualUserId = userData?.id || userData?._id || userData?.user?.id || userData?.user?._id;

      if (actualUserId) {
        const sanitizedRoomId = String(actualUserId).trim();
        console.log(`🔗 Attempting to join personal Socket room: ${sanitizedRoomId}`);
        
        socket.emit('join', sanitizedRoomId);

        socket.off('notification'); 
        socket.on('notification', (data) => {
          console.log("🔔 NOTIFICATION RECEIVED LIVE:", data);
          toast.info(data.message, {
            icon: "🔔",
            autoClose: 5000,
          });
        });
      } else {
        console.error("❌ Socket Error: Could not find a valid User ID in local storage payload.");
      }
    }

    return () => {
      socket.off('notification');
    };
  }, [isLoggedIn]);

  // Sync updated selection setting cleanly with localStorage persistent memory
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); 
    setIsLoggedIn(false);
    socket.emit('logout'); 
  };

  return (
    <Router>
      <div className={`App ${theme}`}>
        <header className="App-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px' }}>
          <h1 style={{ cursor: 'pointer' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Task Management</Link>
          </h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button className="theme-toggle" onClick={toggleTheme} style={{ position: 'static' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            {isLoggedIn && (
              <>
                <Link to="/" style={{ padding: '8px 16px', fontSize: '14px', textDecoration: 'none', background: '#e0e7ff', color: '#4f46e5', borderRadius: '6px', fontWeight: 'bold' }}>
                  📋 Tasks
                </Link>
                <Link to="/analytics" style={{ padding: '8px 16px', fontSize: '14px', textDecoration: 'none', background: '#6366f1', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>
                  📊 Analytics
                </Link>
                <button onClick={handleLogout} className="btn-delete" style={{ padding: '8px 16px', fontSize: '14px' }}>
                  Logout
                </button>
              </>
            )}
          </div>
        </header>

        <Routes>
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/" element={isLoggedIn ? <TaskList /> : <Navigate to="/login" />} />
          <Route path="/analytics" element={isLoggedIn ? <AnalyticsDashboard /> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <ToastContainer position="bottom-right" theme={theme} />
      </div>
    </Router>
  );
}

export default App;