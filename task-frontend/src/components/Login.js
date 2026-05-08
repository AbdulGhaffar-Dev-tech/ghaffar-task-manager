import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; // Optional: Use toast for better UI
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
            const response = await axios.post('http://localhost:5000/api/auth/login', credentials);

            if (response.data.token) {
                // 1. Save the token for API authorization
                localStorage.setItem('token', response.data.token);

                // 2. Save the full user object (includes id, name, and role)
                // This allows TaskList.js to check if (user.role === 'admin')
                localStorage.setItem('user', JSON.stringify(response.data.user));

                setIsLoggedIn(true);
                toast.success(`Welcome back, ${response.data.user.name}!`);
                navigate('/');
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Check your internet or backend connection";
            toast.error(msg); 
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
                            placeholder="your@email.com" 
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
                            placeholder="••••••••" 
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