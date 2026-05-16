const express = require ('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();

// 1. Create HTTP Server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// 2. Essential Middleware
app.use(cors());
app.use(express.json());

// 3. Attach Socket.io to the request object
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
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mytaskmanager')
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 6. API Routes 
// FIX: We must access .router because auth.js exports an object { router, authMiddleware, transporter }
const authData = require('./routes/auth');
app.use('/api/auth', authData.router); 

// Standard import for task routes
app.use('/api/tasks', require('./routes/taskRoutes'));

// ADDED FOR WEEK 5: Link your new Analytics system
app.use('/api/analytics', require('./routes/analytics'));

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// 8. Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is sprinting on port ${PORT}`);
});