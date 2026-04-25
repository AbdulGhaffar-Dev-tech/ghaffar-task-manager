require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/tasks', taskRoutes);

// MongoDB Compass Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskdb')
  .then(() => {
    console.log('Connected to MongoDB Compass ✅');
    app.listen(process.env.PORT || 5000, () => console.log('Server running on port 5000 🚀'));
  })
  .catch(err => console.error('DB Connection Error ❌', err));
  module.exports = app;