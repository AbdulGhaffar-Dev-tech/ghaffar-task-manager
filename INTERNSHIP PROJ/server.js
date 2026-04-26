const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors()); // Crucial for Frontend-Backend communication

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB "))
  .catch(err => console.log(err));

// Use Routes
// ... existing code ...

// Use Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/taskRoutes')); // ADD THIS LINE

// ... rest of the code ...


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));