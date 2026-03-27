const mongoose = require('mongoose');

// 3. The Main User Schema
const userSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String, 
      required: true 
    }
  }, { 
    timestamps: true // Automatically adds createdAt and updatedAt to the user profile
  });

  module.exports = mongoose.model('User', userSchema);