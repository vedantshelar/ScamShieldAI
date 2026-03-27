const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'ai', 'system'], // 'user' for human, 'ai' for Groq
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, {
    timestamps: true // This automatically creates a 'createdAt' timestamp for every message!
})

module.exports = mongoose.model('Chat', chatSchema);