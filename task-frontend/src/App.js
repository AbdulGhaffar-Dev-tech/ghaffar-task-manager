import React, { useState, useEffect } from 'react';
import Tasklist from './components/Tasklist';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
  // This line is what the CSS looks for ([data-theme='dark'])
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}, [theme]);
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <div className="App">
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </button>
      <header className="App-header">
        <h1>Task Management</h1>
      </header>
      
      <Tasklist />

      {/* Professional Notification Container */}
      <ToastContainer position="bottom-right" theme={theme} />
    </div>
  );
}

export default App;