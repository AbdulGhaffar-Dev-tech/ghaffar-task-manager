import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const navigate = useNavigate();

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // This must match your backend URL
            await axios.post('http://localhost:5000/api/auth/update-password', { email, newPassword });
            alert("Password updated successfully!");
            navigate('/login');
        } catch (err) {
            console.error(err);
            alert("Update failed. Check if the email is correct.");
        }
    };

    const containerStyle = {
        padding: '40px',
        maxWidth: '400px',
        margin: '50px auto',
        backgroundColor: 'var(--card-bg)',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        color: 'var(--text-color)'
    };

    return (
        <div style={containerStyle}>
            <h2>Reset Your Password</h2>
            <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '15px', textAlign: 'left' }}>
                    <label>Confirm Email:</label>
                    <input 
                        type="email" 
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                        placeholder="your-email@example.com" 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>
                <div style={{ marginBottom: '15px', textAlign: 'left' }}>
                    <label>New Password:</label>
                    <input 
                        type="password" 
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                        placeholder="Enter new password" 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit" className="auth-btn" style={{ width: '100%' }}>
                    Update Password
                </button>
            </form>
        </div>
    );
};

export default ResetPassword;