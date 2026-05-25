const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const path = require('path'); // ✅ Required to map static frontend assets
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();

// ✅ CORS Origins updated with your explicit live domain
const allowedOrigins = [
  'http://localhost:3000',                                     
  'http://127.0.0.1:3000',                                   
  'https://ghaffar-task-manager-production.up.railway.app'     
];

// 1. Creating HTTP Server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,                    
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// 2. Essential Middleware
app.use(cors({
  origin: allowedOrigins,                      
  credentials: true
}));
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
      socket.join(userId.toString());
      console.log(`👤 User ${userId} joined their private notification room`);
    }
  });

  socket.on('join_admin_room', () => {
    socket.join('admins');
    console.log("🔒 Admin joined the 'admins' broadcast room");
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
const authData = require('./routes/auth');
app.use('/api/auth', authData.router); 
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/analytics', require('./routes/analytics'));

// 🌐 Health check endpoint for Railway verification testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "healthy", message: "Backend is operational!" });
});

app.use(express.static(path.join(__dirname, 'build')));

app.get('*any', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// 8. Start the Server (Using server.listen to keep Socket.io operational!)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});