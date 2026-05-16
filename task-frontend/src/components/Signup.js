import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
  const [user, setUser] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

const handleSignup = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post('http://localhost:5000/api/auth/signup', user);
    if (response.status === 201) {
      alert("Account created successfully! Please login.");
      navigate('/login');
    }
    alert("Signup successful!");
    navigate('/login');
  } catch (err) {
    
    console.log(err.response.data); 
    alert("Signup failed: " + (err.response?.data?.message || "Server is offline"));
  }
};

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Join Us</h2>
        <form onSubmit={handleSignup}>
          <input type="text" placeholder="Name" onChange={(e) => setUser({...user, name: e.target.value})} required />
          <input type="email" placeholder="Email" onChange={(e) => setUser({...user, email: e.target.value})} required />
          <input type="password" placeholder="Password" onChange={(e) => setUser({...user, password: e.target.value})} required />
          <button className="auth-btn">Sign Up</button>
        </form>
        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </div>
  );
};

export default Signup;