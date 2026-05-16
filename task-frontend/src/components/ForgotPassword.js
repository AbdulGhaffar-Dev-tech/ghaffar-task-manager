import React, { useState } from 'react';
import axios from 'axios';
// ADDED THIS IMPORT
import { Link } from 'react-router-dom'; 
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        try {
            // Sending request to your backend auth route
            await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setMessage("If an account exists, a reset link has been sent.");
        } catch (err) {
            setMessage("Error sending reset email.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>
                <p>Enter your email to receive instructions.</p>
                
                {/* Status Message Display */}
                {message && (
                    <p style={{ 
                        color: '#6366f1', 
                        fontWeight: 'bold', 
                        backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                        padding: '10px', 
                        borderRadius: '8px',
                        fontSize: '14px' 
                    }}>
                        {message}
                    </p>
                )}

                <form onSubmit={handleReset}>
                    <div className="input-group">
                        <label style={{ display: 'block', textAlign: 'left', marginBottom: '5px', fontWeight: '600' }}>
                            Email Address
                        </label>
                        <input 
                            type="email" 
                            placeholder="name@example.com" 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                        />
                    </div>
                    <button type="submit" className="auth-btn" style={{ marginTop: '10px' }}>
                        Send Reset Link
                    </button>
                </form>

                <p className="auth-footer">
                    {/* Link back to login page */}
                    <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;