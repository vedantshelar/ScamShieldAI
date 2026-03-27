// backend/app.js
require('dotenv').config(); // Loads your .env file
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Groq = require('groq-sdk');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Chat = require('./models/Chat');
const app = express();


// Important: CORS must be configured to allow credentials (cookies)
app.use(cors({
  origin: process.env.FRONTED_URL, // Change to your React port (e.g., 5173 for Vite)
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser()); // Allows Node to read incoming cookies

// Configure Multer to hold the uploaded image in memory (RAM) temporarily
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Groq Client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


// ==========================================
// MONGODB DATABASE CONNECTION
// ==========================================
const DB_URL = process.env.DB_URL;

mongoose.connect(DB_URL)
  .then(() => console.log('✅ MongoDB Connected successfully!'))
  .catch((err) => console.error('🔴 MongoDB Connection Error:', err));



// ==========================================
// CHECK AUTH STATUS ROUTE (For auto-redirects)
// ==========================================
app.get('/api/auth/check', async (req, res) => {
  try {
    // 1. Grab the token from the cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // 2. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find the user (exclude the password from the result!)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // 4. If everything is good, send the user data back
    res.json({ isAuthenticated: true, user });

  } catch (error) {
    // If the token is expired or invalid, just send a 401 Unauthorized
    res.status(401).json({ error: "Invalid token" });
  }
});


// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    // 3. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Save the user to MongoDB
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });
    await newUser.save();   

    // 5. Generate the JWT Token
    // We embed the user's MongoDB _id inside the token payload
    const token = jwt.sign(
      { id: newUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // 6. Set the HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true, // React cannot read this (Prevents XSS)
      secure: process.env.NODE_ENV === 'production', // Only true if using HTTPS
      sameSite: 'lax', // Protects against CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    // 7. Send success response back to React (DO NOT send the password!)
    console.log(`✅ New user registered: ${newUser.email}`);
    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error("🔴 Signup Error:", error.message);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// ==========================================
// LOGIN ROUTE
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try { 
    const { email, password } = req.body;

    // 1. Validate that the React frontend sent both fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // 2. Find the user in MongoDB by their email
    const user = await User.findOne({ email });
    if (!user) {
      // Security best practice: Don't reveal if the email exists or not
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // 3. Compare the typed password with the securely hashed database password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // 4. Generate the JWT Token for this user
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // 5. Send the token back to React inside an HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true, // Prevents XSS attacks in React
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      maxAge: 7 * 24 * 60 * 60 * 1000 // Cookie lasts for 7 days
    });

    console.log(`✅ User logged in: ${user.email}`);
    
    // 6. Send the success response to trigger the React navigate('/dashboard')
    res.json({
      message: "Logged in successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("🔴 Login Error:", error.message);
    res.status(500).json({ error: "Server error during login." });
  }
});  

// ==========================================
// LOGOUT ROUTE
// ==========================================
app.post('/api/auth/logout', (req, res) => {
  try {
    // To log the user out, we just clear the HTTP-Only cookie we set earlier
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log(`👋 User logged out successfully.`);
    res.json({ message: "Logged out successfully!" });

  } catch (error) {
    console.error("🔴 Logout Error:", error.message);
    res.status(500).json({ error: "Server error during logout." });
  }
});

// --- THE HYBRID API ROUTE ---
app.post('/api/scan', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        console.log(`\n📩 1. Received message: "${message}"`);

        // ==========================================
        // PHASE 1: Get the Score from Python ML
        // ==========================================
        console.log(`🤖 2. Asking Python ML model for score...`);
        const flaskResponse = await axios.post('http://127.0.0.1:5000/analyze', { message });
        const aiResult = flaskResponse.data; // e.g., { is_scam: true, confidence_score: "95%" }

        // Clean the score
        let numericScore = parseInt(aiResult.confidence_score.replace('%', ''), 10);

        // Convert "Confidence Score" into a "Threat Level Score"
        if (!aiResult.is_scam) {
            numericScore = 100 - numericScore; // Turns 95% confident safe into 5% threat
        }

        // Determine the status color
        let calculatedStatus = 'safe';
        if (aiResult.is_scam) {
            calculatedStatus = numericScore > 80 ? 'danger' : 'warning';
        }
        // ==========================================
        // PHASE 2: Get the Explanation from Groq LLM
        // ==========================================
        console.log(`🧠 3. Asking Groq to generate reasoning...`);

        const systemPrompt = `You are a cybersecurity expert analyzing a message. 
    Our custom ML model has already classified this message as: ${aiResult.is_scam ? 'SCAM' : 'SAFE'}.
    
    Your job is to generate the explanation and identify manipulation tactics. 
    You MUST output ONLY valid JSON. Do not include markdown formatting or extra text.
    
    Required JSON Structure:
    {
      "type": "Short string (e.g., 'Phishing / OTP Scam', 'Digital Arrest', 'Safe Message')",
      "manipulation": ["Array", "of", "strings", "max 3 tactics (e.g., 'Urgency', 'Fear')"],
      "explanation": "A 1-2 sentence explanation of why this is a threat or why it is safe."
    }`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analyze this message: "${message}"` }
            ],
            model: "llama-3.1-8b-instant", // <--- THE NEW, FAST MODEL
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        // Parse the JSON string returned by Groq
        const groqData = JSON.parse(chatCompletion.choices[0].message.content);

        // ==========================================
        // PHASE 3: Combine and Send to React
        // ==========================================
        const finalFrontendData = {
            status: calculatedStatus,          // From Python logic
            score: numericScore,               // From Python model
            type: groqData.type,               // From Groq
            manipulation: groqData.manipulation, // From Groq
            explanation: groqData.explanation  // From Groq
        };

        console.log(`✅ 4. Sending final packaged data to React:`, finalFrontendData);
        res.json(finalFrontendData);

    } catch (error) {
        console.error("🔴 Backend Error:", error.message);
        res.status(500).json({ error: "ScamShield servers are currently analyzing heavy traffic. Try again." });
    }
});

app.post('/api/scan-image', upload.single('scamImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }
  
      console.log(`\n📸 1. Received image: ${req.file.originalname}`);
      console.log(`🔍 2. Running OCR to extract text...`);
  
      // 1. Run Tesseract OCR on the image buffer
      const ocrResult = await Tesseract.recognize(req.file.buffer, 'eng', {
        logger: m => console.log(m.status, Math.round(m.progress * 100) + '%') // Shows progress in console
      });
  
      const extractedText = ocrResult.data.text.trim();
      console.log(`📝 Extracted Text: "${extractedText}"`);
  
      if (!extractedText) {
        return res.status(400).json({ 
          error: "Could not read any text from the image. It might be too blurry." 
        });
      }
  
      // ==========================================
      // REUSE YOUR EXISTING LOGIC NOW!
      // ==========================================
      console.log(`🤖 3. Asking Python ML model for score...`);
      const flaskResponse = await axios.post('http://127.0.0.1:5000/analyze', { 
        message: extractedText 
      });
      
      const aiResult = flaskResponse.data;
      let numericScore = parseInt(aiResult.confidence_score.replace('%', ''), 10);
      
      if (!aiResult.is_scam) {
        numericScore = 100 - numericScore;
      }
      
      let calculatedStatus = 'safe';
      if (aiResult.is_scam) {
        calculatedStatus = numericScore > 80 ? 'danger' : 'warning';
      }
  
      // ==========================================
    // PHASE 2: Get the Explanation from Groq LLM
    // ==========================================
    console.log(`🧠 4. Asking Groq to generate reasoning...`);
    
    // FIX 1: Clean the OCR text! Remove excessive newlines so it doesn't break Groq's brain
    const cleanText = extractedText.replace(/\n/g, ' ').replace(/"/g, "'").trim();

    const systemPrompt = `You are a cybersecurity expert analyzing a message extracted from an image via OCR. 
    Our custom ML model has already classified this message as: ${aiResult.is_scam ? 'SCAM' : 'SAFE'}.
    
    Your job is to generate the explanation and identify manipulation tactics. 
    You MUST output ONLY valid JSON. Do not include markdown formatting.
    
    Required JSON Structure:
    {
      "type": "Short string (e.g., 'Digital Arrest', 'Fake Payment Receipt', 'Safe')",
      "manipulation": ["Array", "of", "strings", "max 3 tactics"],
      "explanation": "A 1-2 sentence explanation of why this is a threat or why it is safe."
    }`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this extracted text: "${cleanText}"` }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      // FIX 2: Log the raw response so we can see exactly what Groq is doing
      const rawGroqResponse = chatCompletion.choices[0].message.content;
      console.log(`\n🕵️ Raw Groq Output:\n`, rawGroqResponse);

      const groqData = JSON.parse(rawGroqResponse);

      const finalFrontendData = {
        status: calculatedStatus,
        score: numericScore,
        type: groqData.type,
        manipulation: groqData.manipulation,
        explanation: groqData.explanation,
        extracted_text: extractedText 
      };

      console.log(`\n✅ 5. Sending image analysis back to React!`);
      res.json(finalFrontendData);

    } catch (groqError) {
      console.error("\n🔴 GROQ OR JSON PARSING ERROR:", groqError.message);
      
      // FIX 3: Hackathon Fallback! If Groq fails, still send the Python ML data to the frontend!
      res.json({
        status: calculatedStatus,
        score: numericScore,
        type: "Suspicious Image",
        manipulation: ["Unknown"],
        explanation: "Our ML model flagged this image, but the AI reasoning engine timed out processing the OCR text.",
        extracted_text: extractedText
      });
    }

  } catch (error) {
    console.error("\n🔴 General Image Scan Error:", error.message);
    res.status(500).json({ error: "Failed to process image." });
  }
});


// --- THE NEW MULTILINGUAL AUDIO SCANNER ROUTE ---
// React will send the file under the field name 'scamAudio'
app.post('/api/scan-audio', upload.single('scamAudio'), async (req, res) => {
  let tempFilePath = '';

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    console.log(`\n🎙️ 1. Received audio file: ${req.file.originalname}`);

    // 1. Create a temporary file so Groq Whisper can read it
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `upload_${Date.now()}_${req.file.originalname}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // ==========================================
    // PHASE 1: Native Speech-to-Text (Auto-Detect)
    // ==========================================
    console.log(`🔍 2. Running Groq Whisper to transcribe native audio...`);
    
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-large-v3", // State-of-the-art audio model
      response_format: "json"
      // ❌ REMOVED 'language: "en"' so Whisper auto-detects Marathi, Hindi, etc.
    });

    const extractedText = transcription.text.trim();
    console.log(`📝 Native Transcript: "${extractedText}"`);

    if (!extractedText) {
      return res.status(400).json({ 
        error: "Could not transcribe any text from the audio. It might be silent." 
      });
    }

    // ==========================================
    // PHASE 2: Native Language AI Reasoning
    // ==========================================
    console.log(`🧠 3. Asking Groq LLM to score and analyze in the native language...`);
    
    // Clean the transcript text
    const cleanText = extractedText.replace(/\n/g, ' ').replace(/"/g, "'").trim();

// 🌟 The Zero-Bias Multilingual Prompt
const systemPrompt = `You are a cybersecurity expert analyzing a transcribed audio call.
    
CRITICAL LANGUAGE RULE: 
You MUST output your analysis in the EXACT SAME language that the transcript is written in. 
DO NOT TRANSLATE the text. If the transcript consists of English words, your explanation MUST be written in English. 

Calculate a Threat Score (0 to 100).
- 'danger': Score 80-100 
- 'warning': Score 40-79 
- 'safe': Score 0-39 

You MUST output ONLY valid JSON. Keep the JSON keys strictly in English. Do not include markdown.

Required JSON Structure:
{
  "detected_language": "State the language you are reading",
  "status": "danger", 
  "score": 95, 
  "type": "Threat type written in the detected_language",
  "manipulation": ["Tactics written in the detected_language"],
  "explanation": "A 1-2 sentence explanation written in the detected_language."
}`;
    let groqData;
    
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this transcript: "${cleanText}"` }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const rawGroqResponse = chatCompletion.choices[0].message.content;
      console.log(`\n🕵️ Raw Groq Output:\n`, rawGroqResponse);
      groqData = JSON.parse(rawGroqResponse);
      
    } catch (groqError) {
      console.error("\n🔴 GROQ OR JSON PARSING ERROR:", groqError.message);
      
      // Fallback in case the LLM messes up the JSON formatting during translation
      groqData = {
        status: "warning",
        score: 75,
        type: "Suspicious Audio / संशयास्पद ऑडिओ",
        manipulation: ["Unknown / अज्ञात"],
        explanation: "The AI flagged this audio but encountered an error formatting the native explanation. Please review carefully."
      };
    }

    // ==========================================
    // PHASE 3: Package & Send to React
    // ==========================================
    const finalFrontendData = {
      status: groqData.status,
      score: groqData.score,
      type: groqData.type,
      manipulation: groqData.manipulation,
      explanation: groqData.explanation,
      extracted_text: extractedText // Send the transcript back so the user can read it!
    };

    console.log(`✅ 4. Sending multilingual audio analysis back to React!`);
    res.json(finalFrontendData);

  } catch (error) {
    console.error("\n🔴 Audio Scan Error:", error.message);
    res.status(500).json({ error: "Failed to process audio file." });
  } finally {
    // SECURITY/CLEANUP: Always delete the temporary audio file!
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});


// ==========================================
// AI HELP DESK - PRE-SCAM INVESTIGATOR
// ==========================================
app.post('/api/chat/pre-scam', async (req, res) => {
  try {
    // 1. AUTHENTICATION: Check who is sending the message via the HTTP-Only cookie
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "You must be logged in to use the Help Desk." });
    }
    
    // Decode the token to get the user's MongoDB _id
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    console.log(`\n🕵️ [Pre-Scam Bot] Processing message from user: ${userId}`);

    // 2. SAVE THE USER'S MESSAGE TO MONGODB
    await Chat.create({
      user_id: userId,
      role: 'user',
      message: message
    });

    // 3. FETCH CONTEXT: Get the last 15 messages so the AI remembers the conversation
    const chatHistory = await Chat.find({ user_id: userId })
      .sort({ createdAt: 1 }) // Sort oldest to newest so the conversation flows naturally
      .limit(15); 

    // 4. FORMAT FOR GROQ: Groq expects roles to be 'user', 'assistant', or 'system'.
    // Your database uses 'ai', so we have to map 'ai' to 'assistant' for Groq.
    const groqMessages = chatHistory.map(chat => ({
      role: chat.role === 'ai' ? 'assistant' : chat.role,
      content: chat.message
    }));

    // 5. INJECT THE DYNAMIC PROMPT: Tell the AI who it is right now
    const systemPrompt = {
      role: 'system',
      content: `You are an elite Pre-Scam Investigator for ScamShieldAI. 
      Your job is to analyze suspicious emails, text messages, links, or phone calls the user shares.
      
      Rules:
      - Be highly analytical, sharp, and direct.
      - Point out specific "red flags" (e.g., urgency, weird domains, asking for OTPs).
      - Do not provide post-scam damage control here. Focus purely on prevention and analysis.
      - Keep responses concise and formatted with short paragraphs or bullet points.`
    };
    
    // Add the system prompt to the very beginning of the array
    groqMessages.unshift(systemPrompt);

    // 6. CALL GROQ LLM
    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.1-8b-instant",
      temperature: 0.4, // Lower temperature keeps it highly analytical and factual
    });

    const aiResponse = chatCompletion.choices[0].message.content;

    // 7. SAVE THE AI'S RESPONSE TO MONGODB
    await Chat.create({
      user_id: userId,
      role: 'ai', // Saving it as 'ai' just like your schema requires
      message: aiResponse
    });

    console.log(`✅ [Pre-Scam Bot] Replied successfully.`);
    
    // 8. SEND THE RESPONSE BACK TO REACT
    res.json({ reply: aiResponse });

  } catch (error) {
    console.error("🔴 Pre-Scam Chat Error:", error.message);
    res.status(500).json({ error: "The Investigator is currently offline. Please try again." });
  }
});


// ==========================================
// GET USER CHAT HISTORY
// ==========================================
app.get('/api/chat/history', async (req, res) => {
  try {
    // 1. Verify who is asking for the history
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "You must be logged in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2. Fetch all their messages from the database, sorted oldest to newest
    const chatHistory = await Chat.find({ user_id: userId }).sort({ createdAt: 1 });

    // 3. Send the history back to React
    res.json(chatHistory);

  } catch (error) {
    console.error("🔴 History Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to load chat history." });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Node.js Gateway running on http://localhost:${PORT}`));