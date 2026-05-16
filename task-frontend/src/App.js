import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'; // ADDED: Link import here
import TaskList from './components/TaskList'; 
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword'; 
import Login from './components/Login';
import Signup from './components/Signup';
import AnalyticsDashboard from './components/AnalyticsDashboard'; // ADDED: Import Analytics Page
import { ToastContainer, toast } from 'react-toastify'; 
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

  // --- SOCKET.IO NOTIFICATION LOGIC ---
  useEffect(() => {
    if (isLoggedIn) {
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (userData && userData.id) {
        socket.emit('join', userData.id);

        socket.on('notification', (data) => {
          toast.info(data.message, {
            icon: "🔔",
            autoClose: 5000,
          });
        });
      }
    }

    return () => {
      socket.off('notification');
    };
  }, [isLoggedIn]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); 
    setIsLoggedIn(false);
    socket.emit('logout'); 
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px' }}>
          <h1 style={{ cursor: 'pointer' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Task Management</Link>
          </h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button className="theme-toggle" onClick={toggleTheme} style={{ position: 'static' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            {/* ADDED: Dynamic Analytics & Home Nav Buttons */}
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
          
          {/* SECURE ROUTES: Protected by your login state */}
          <Route path="/" element={isLoggedIn ? <TaskList /> : <Navigate to="/login" />} />
          <Route path="/analytics" element={isLoggedIn ? <AnalyticsDashboard /> : <Navigate to="/login" />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <ToastContainer position="bottom-right" theme={theme} />
      </div>
    </Router>
  );
}

export default App;