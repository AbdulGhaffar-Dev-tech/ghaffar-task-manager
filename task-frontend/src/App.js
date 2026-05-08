import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TaskList from './components/TaskList'; 
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword'; 
import Login from './components/Login';
import Signup from './components/Signup';
import { ToastContainer, toast } from 'react-toastify'; // Added toast here
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // --- NEW: SOCKET.IO NOTIFICATION LOGIC ---
  useEffect(() => {
    if (isLoggedIn) {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (userData && userData.id) {
        // Join a private room based on User ID to receive personal notifications
        socket.emit('join', userData.id);

        // Listen for real-time notifications from the server
        socket.on('notification', (data) => {
          toast.info(data.message, {
            icon: "🔔",
            autoClose: 5000,
          });
        });
      }
    }

    // Cleanup connection on unmount or logout
    return () => {
      socket.off('notification');
    };
  }, [isLoggedIn]);
  // ------------------------------------------

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); 
    setIsLoggedIn(false);
    socket.emit('logout'); // Notify socket of logout
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px' }}>
          <h1>Task Management</h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button className="theme-toggle" onClick={toggleTheme} style={{ position: 'static' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            {isLoggedIn && (
              <button onClick={handleLogout} className="btn-delete" style={{ padding: '8px 16px', fontSize: '14px' }}>
                Logout
              </button>
            )}
          </div>
        </header>

        <Routes>
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={isLoggedIn ? <TaskList /> : <Navigate to="/login" />} />
        </Routes>

        <ToastContainer position="bottom-right" theme={theme} />
      </div>
    </Router>
  );
}

export default App;