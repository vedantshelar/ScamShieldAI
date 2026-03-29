// backend/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  scammerDetails: { type: String, required: true },
  description: { type: String, required: true },
  
  // 🌟 NEW: Add these fields to track the AI's moderation!
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  aiReason: { type: String, default: '' } // Stores why Groq approved/rejected it

}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);