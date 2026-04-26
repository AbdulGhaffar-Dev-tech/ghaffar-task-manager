const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Ensure this path is correct
const bcrypt = require('bcryptjs');
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
    console.error("Signup Error:", err);
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

    res.status(200).json({ 
      message: "Login successful!", 
      token: "dummy-token-123", 
      user: { id: user._id, name: user.name } 
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

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

    // 1. Hash the new password first
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 2. Use findOneAndUpdate to bypass 'name' validation
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { password: hashedPassword } },
      { new: true, runValidators: false } // runValidators: false is key here
    );
    
    if (!user) {
      console.log("Update failed: User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Password updated successfully for:", email);
    res.status(200).json({ message: "Password updated" });

  } catch (err) {
    console.error("Update PW Backend Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;