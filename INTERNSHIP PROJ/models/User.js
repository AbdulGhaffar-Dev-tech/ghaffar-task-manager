const mongoose = require('mongoose'); // <--- THIS LINE WAS MISSING

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
 email: {
  type: String,
  required: true,
  unique: true,
  trim: true,       // Cleans up accidental trailing/leading spaces automatically
  lowercase: true   // Forces entry down to standard lowercase values
},
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);