// backend/models/TempDataset.js
const mongoose = require('mongoose');

const tempDatasetSchema = new mongoose.Schema({
  message: { type: String, required: true },
  label: { type: Number, required: true, enum: [0, 1] }, // 1 = Scam, 0 = Safe
  category: { type: String, required: true } // 'Bank', 'OTP', 'Digital arrest', 'Not sure'
}, { timestamps: true });

module.exports = mongoose.model('TempDataset', tempDatasetSchema);