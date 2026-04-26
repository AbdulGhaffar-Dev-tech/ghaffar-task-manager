import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Login = ({ setIsLoggedIn }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Inside your Login component handleLogin function
const response = await axios.post('http://localhost:5000/api/auth/login', credentials);

if (response.data.user) {
    // CRITICAL: You must save the user object so TaskForm can find the ID later
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', response.data.token);
    setIsLoggedIn(true);
    navigate('/');
}
        } catch (err) {
            const msg = err.response?.data?.message || "Check your internet/backend";
            alert("Login Error: " + msg); 
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Welcome Back</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Email" 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label>Password</label>
                            <Link to="/forgot-password" style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>
                                Forgot Password?
                            </Link>
                        </div>
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Password" 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <button type="submit" className="auth-btn">Sign In</button>
                </form>
                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;