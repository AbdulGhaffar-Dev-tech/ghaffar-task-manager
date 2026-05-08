const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const nodemailer = require('nodemailer');

// 1. Transporter Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, 
  secure: true, 
  auth: {
    user: 'um1697170@gmail.com', 
    pass: 'dqxvqgeemlhursti'      
  }
});

// --- AUTH MIDDLEWARE FUNCTION ---
const authMiddleware = async (req, res, next) => {
  // Look for the Authorization header
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  // Extract the actual token
  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// 2. SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error during signup" });
  }
});

// 3. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role || 'user' }, 
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      message: "Login successful!", 
      token: token, 
      user: { id: user._id, name: user.name, role: user.role || 'user' } 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// 4. FORGOT PASSWORD & 5. UPDATE PASSWORD (Logic remains the same)
// ... [Keep your existing forgot-password and update-password routes here] ...

// --- FIXED EXPORTS ---
// Instead of overwriting module.exports, we export an object containing everything
module.exports = {
  router,          // Used in server.js: app.use('/api/auth', auth.router)
  authMiddleware,  // Used in taskRoutes.js: const { authMiddleware } = require('./auth')
  transporter      // Used in taskRoutes.js: const { transporter } = require('./auth')
};

// 4. FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const resetLink = "http://localhost:3000/reset-password";
    
    try {
      await transporter.sendMail({
        from: '"Task Manager Support" <um1697170@gmail.com>',
        to: email,
        subject: 'Reset Your Password',
        text: `Hello ${user.name},\n\nYou requested a password reset. Please click the link below to set a new password:\n\n${resetLink}`
      });
      res.status(200).json({ message: "Email sent successfully!" });
    } catch (mailError) {
      console.log("Mail failed, link for testing:", resetLink);
      res.status(200).json({ 
        message: "SMTP Blocked. For demo purposes, use this link:", 
        debugLink: resetLink 
      });
    }
  } catch (err) {
    console.error("Forgot PW Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 5. UPDATE PASSWORD
router.post('/update-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { password: hashedPassword } },
      { new: true, runValidators: false } 
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = {
  router,          // Used in server.js: app.use('/api/auth', auth.router)
  authMiddleware,  // Used in taskRoutes.js: const { authMiddleware } = require('./auth')
  transporter      // Used in taskRoutes.js: const { transporter } = require('./auth')
};