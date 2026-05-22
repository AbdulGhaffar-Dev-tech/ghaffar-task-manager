const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const path = require('path'); // Added for handling directory paths
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();

// 1. Creating HTTP Server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Changed to wildcard so production URLs can connect seamlessly
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// 2. Essential Middleware
app.use(cors());
app.use(express.json());

// 3. Attachment of Socket.io to the request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 4. Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`👤 User ${userId} joined their private notification room`);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

// 5. Database Connection
const mongoURL = process.env.MONGO_URI;

mongoose.connect(mongoURL)
  .then(() => console.log('🍃 Connected to MongoDB Atlas Successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));
// 6. API Routes
const authData = require('./routes/auth');
app.use('/api/auth', authData.router); 
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/analytics', require('./routes/analytics'));

// =========================================================================
//  SERVE FRONTEND BUILD PRODUCTION FILES DIRECTLY FROM BACKEND
// =========================================================================
// 1. Tell Express to look inside your pasted "build" folder for frontend assets
app.use(express.static(path.join(__dirname, 'build')));

// 2. Fallback Wildcard Route: Redirect any non-API page requests to the React index entry point
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
// =========================================================================
// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// 8. Start the Server (Using server.listen to keep Socket.io operational!)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is sprinting on port ${PORT}`);
});