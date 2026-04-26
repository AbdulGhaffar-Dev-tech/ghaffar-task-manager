import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TaskList from './components/TaskList'; 
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword'; 
import Login from './components/Login';
import Signup from './components/Signup';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Check if token exists to keep user logged in on refresh
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Clean up user data too
    setIsLoggedIn(false);
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
          {/* Use setIsLoggedIn here to match the common naming convention */}
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Route */}
          <Route path="/" element={isLoggedIn ? <TaskList /> : <Navigate to="/login" />} />
        </Routes>

        <ToastContainer position="bottom-right" theme={theme} />
      </div>
    </Router>
  );
}

export default App;