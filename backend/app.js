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
const Report = require('./models/Report');
const TempDataset = require('./models/TempDataset');
const nodemailer = require('nodemailer');
const app = express();


// Important: CORS must be configured to allow credentials (cookies)
console.log(process.env.FRONTED_URL)
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

// // --- THE HYBRID API ROUTE ---
// app.post('/api/scan', async (req, res) => {
//     try {
//         const { message } = req.body;
//         if (!message) return res.status(400).json({ error: "Message is required" });

//         console.log(`\n📩 1. Received message: "${message}"`);

//         // ==========================================
//         // PHASE 1: Get the Score from Python ML
//         // ==========================================
//         console.log(`🤖 2. Asking Python ML model for score...`);
//         const flaskResponse = await axios.post('http://127.0.0.1:5000/analyze', { message });
//         const aiResult = flaskResponse.data; // e.g., { is_scam: true, confidence_score: "95%" }

//         // Clean the score
//         let numericScore = parseInt(aiResult.confidence_score.replace('%', ''), 10);

//         // Convert "Confidence Score" into a "Threat Level Score"
//         if (!aiResult.is_scam) {
//             numericScore = 100 - numericScore; // Turns 95% confident safe into 5% threat
//         }

//         // Determine the status color
//         let calculatedStatus = 'safe';
//         if (aiResult.is_scam) {
//             calculatedStatus = numericScore > 80 ? 'danger' : 'warning';
//         }
//         // ==========================================
//         // PHASE 2: Get the Explanation from Groq LLM
//         // ==========================================
//         console.log(`🧠 3. Asking Groq to generate reasoning...`);

//         const systemPrompt = `You are a cybersecurity expert analyzing a message. 
//         Our custom ML model has already classified this message as: ${aiResult.is_scam ? 'SCAM' : 'SAFE'}.
        
//         Your job is to categorize the threat, generate an explanation, and identify manipulation tactics. 
//         You MUST output ONLY valid JSON. Do not include markdown formatting or extra text.
        
//         Required JSON Structure:
//         {
//           "type": "Choose EXACTLY ONE category from this list: ['Financial / Bank Fraud', 'Digital Arrest', 'Fake Job / Task Scam', 'Phishing / Malicious Link', 'Authority Impersonation', 'Safe', 'Unknown']",
//           "manipulation": ["Array", "of", "strings", "max 3 tactics (e.g., 'Urgency', 'Fear', 'Authority')"],
//           "explanation": "A 1-2 sentence explanation of why this is a threat or why it is safe."
//         }`;

//         const chatCompletion = await groq.chat.completions.create({
//             messages: [
//                 { role: "system", content: systemPrompt },
//                 { role: "user", content: `Analyze this message: "${message}"` }
//             ],
//             model: "llama-3.1-8b-instant", // <--- THE NEW, FAST MODEL
//             temperature: 0.3,
//             response_format: { type: "json_object" },
//         });
           
//         // Parse the JSON string returned by Groq
//         const groqData = JSON.parse(chatCompletion.choices[0].message.content);

//         // ==========================================
//         // PHASE 3: Combine and Send to React
//         // ==========================================
//         const finalFrontendData = {
//             status: calculatedStatus,          // From Python logic
//             score: numericScore,               // From Python model
//             type: groqData.type,               // From Groq
//             manipulation: groqData.manipulation, // From Groq
//             explanation: groqData.explanation  // From Groq
//         };

//         console.log(`✅ 4. Sending final packaged data to React:`, finalFrontendData);
//         res.json(finalFrontendData);

//     } catch (error) {
//         console.error("🔴 Backend Error:", error.message);
//         res.status(500).json({ error: "ScamShield servers are currently analyzing heavy traffic. Try again." });
//     }
// });

// --- THE HYBRID API ROUTE (AUTO-ROUTING ENABLED) ---
app.post('/api/scan', async (req, res) => {
  try {
      // 🌟 Remove category from req.body since we are auto-detecting it!
      const { message } = req.body;
      
      if (!message) return res.status(400).json({ error: "Message is required" });

      console.log(`\n📩 1. Received message: "${message}"`);

      // ==========================================
      // PHASE 0: Auto-Detect Category with Groq LLM
      // ==========================================
      console.log(`🤖 1.5. Asking Groq to auto-detect the expert category...`);
      
      const routingPrompt = `You are a strict categorization AI. Read the message and categorize it into EXACTLY ONE of these four strings: "Bank", "OTP", "Digital arrest", or "Not sure". 
        
      RULES & PRIORITIES:
      1. "OTP": Highest priority. If the message explicitly contains a One Time Password, OTP, verification code, or PIN, output "OTP" (Even if it mentions a bank).
      2. "Bank": If it mentions money deducted/credited, bank accounts, credit cards, EMI, or KYC updates, output "Bank".
      3. "Digital arrest": If it mentions Police, CBI, Customs, FedEx package seized, Supreme Court, or arrest warrants, output "Digital arrest".
      4. "Not sure": If it is a job offer, part-time work, lottery scam, regular conversation, or anything else, output "Not sure".

      You MUST output ONLY valid JSON. DO NOT invent new categories. Use exact capitalization.
      
      Required JSON Structure: 
      {"category": "Insert exact string here"}`;

      const routingCompletion = await groq.chat.completions.create({
          messages: [
              { role: "system", content: routingPrompt },
              { role: "user", content: `Message: "${message}"` }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.1, // Keep it low so it doesn't hallucinate categories
          response_format: { type: "json_object" },
      });

      const routingData = JSON.parse(routingCompletion.choices[0].message.content);
      
      // Ensure it defaults to 'Not sure' if Groq messes up
      const detectedCategory = routingData.category || 'Not sure'; 
      console.log(`🎯 Auto-Detected Category: [${detectedCategory}]`);

      // ==========================================
      // PHASE 1: Get the Score from Python ML
      // ==========================================
      console.log(`🤖 2. Asking Python ML Router for score...`);
      
      // 🌟 Send the AUTO-DETECTED category to Flask!
      const flaskResponse = await axios.post('http://127.0.0.1:5000/analyze', { 
          message: message,
          category: detectedCategory 
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
        console.log(`🧠 3. Asking Groq to generate reasoning...`);

        let systemPrompt = "";

        if (aiResult.is_scam) {
            // 🌟 THE FIX: Pass the detectedCategory to Groq and give it strict Mapping Rules!
            systemPrompt = `You are a cybersecurity expert. Our custom ML model classified this message as a SCAM.
            The routing engine has already flagged the context as: "${detectedCategory}".
            
            Your job is to assign the final threat type, explain why it is dangerous, and identify manipulation tactics.
            You MUST output ONLY valid JSON. Do not include markdown.
            
            MAPPING RULES:
            - If context is "Bank", you MUST choose "Financial / Bank Fraud".
            - If context is "OTP", you MUST choose "OTP / Verification Scam".
            - If context is "Digital arrest", you MUST choose "Digital Arrest / Authority Impersonation".
            - If context is "Not sure", read the text and choose "Fake Job / Task Scam", "Phishing / Malicious Link", or "Unknown".
            
            Required JSON Structure:
            {
              "type": "Insert the EXACT string chosen from the mapping rules above",
              "manipulation": ["Array", "of", "strings", "max 3 tactics (e.g., 'Urgency', 'Fear', 'Authority')"],
              "explanation": "A 1-2 sentence explanation of why this is a threat."
            }`;
        } else {
            // SAFE MESSAGE RULES (Leave this exactly as it is)
            systemPrompt = `You are a cybersecurity expert. Our custom ML model classified this message as SAFE.
            Your job is to explain why this is a legitimate, normal message. DO NOT hallucinate threats.
            You MUST output ONLY valid JSON.
            
            Required JSON Structure:
            {
              "type": "Safe Message",
              "manipulation": [],
              "explanation": "Provide a positive 1-2 sentence explanation of why this looks like a normal, safe message."
            }`;
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analyze this message: "${message}"` }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.1, 
            response_format: { type: "json_object" },
        });

      const groqData = JSON.parse(chatCompletion.choices[0].message.content);

      // ==========================================
      // PHASE 3: Combine and Send to React
      // ==========================================
      const finalFrontendData = {
          status: calculatedStatus,          
          score: numericScore,               
          type: groqData.type,               
          manipulation: groqData.manipulation, 
          explanation: groqData.explanation,
          expert_used: aiResult.expert_used // Tells React which ML brain made the call
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
    // PHASE 1: Python ML Model (General Pipeline)
    // ==========================================
    console.log(`🤖 3. Asking Python ML model for score...`);
    const flaskResponse = await axios.post('http://127.0.0.1:5000/analyze', { 
      message: extractedText,
      category: 'Not sure' // 🌟 FORCES Flask to use the general overall scam model!
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
    // PHASE 2: Dynamic Groq LLM Reasoning
    // ==========================================
    console.log(`🧠 4. Asking Groq to generate reasoning...`);
    
    const cleanText = extractedText.replace(/\n/g, ' ').replace(/"/g, "'").trim();

    let systemPrompt = "";

    // 🌟 NEW: The same strict If/Else logic we used in the text scanner
    if (aiResult.is_scam) {
        systemPrompt = `You are a cybersecurity expert analyzing a message extracted from an image via OCR. 
        Our custom ML model has classified this message as a SCAM.
        Your job is to categorize the scam, generate an explanation, and identify manipulation tactics. 
        You MUST output ONLY valid JSON.
        
        Required JSON Structure:
        {
          "type": "Choose EXACTLY ONE category: ['Financial / Bank Fraud', 'Digital Arrest', 'Fake Job Scam', 'Phishing / Malicious Link', 'Fake Payment Receipt', 'Unknown']",
          "manipulation": ["Array", "of", "strings", "max 3 tactics"],
          "explanation": "A 1-2 sentence explanation of why this is a threat based specifically on the text provided."
        }`;     
    } else {
        systemPrompt = `You are a cybersecurity expert analyzing a message extracted from an image via OCR. 
        Our custom ML model has classified this message as SAFE.
        Your job is to explain why this is a normal image. DO NOT hallucinate fraud or manipulation tactics.
        You MUST output ONLY valid JSON.
        
        Required JSON Structure:
        {
          "type": "Safe Image",
          "manipulation": [],
          "explanation": "Provide a positive 1-2 sentence explanation of why this looks like a normal, safe image."
        }`;
    }

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this extracted text: "${cleanText}"` }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1, // 🌟 Low temperature for strict adherence
        response_format: { type: "json_object" },
      });

      const rawGroqResponse = chatCompletion.choices[0].message.content;
      console.log(`\n🕵️ Raw Groq Output:\n`, rawGroqResponse);

      const groqData = JSON.parse(rawGroqResponse);

      const finalFrontendData = {
        status: calculatedStatus,
        score: numericScore,
        type: groqData.type,
        manipulation: groqData.manipulation,
        explanation: groqData.explanation,
        extracted_text: extractedText,
        expert_used: aiResult.expert_used // Tells React it used the General model
      };

      console.log(`\n✅ 5. Sending image analysis back to React!`);
      res.json(finalFrontendData);

    } catch (groqError) {
      console.error("\n🔴 GROQ OR JSON PARSING ERROR:", groqError.message);
      
      res.json({
        status: calculatedStatus,
        score: numericScore,
        type: "Suspicious Image",
        manipulation: ["Unknown"],
        explanation: "Our ML model flagged this image, but the AI reasoning engine timed out processing the OCR text.",
        extracted_text: extractedText,
        expert_used: 'Not sure'
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
// app.post('/api/chat/pre-scam', async (req, res) => {
//   try {
//     // 1. AUTHENTICATION: Check who is sending the message via the HTTP-Only cookie
//     const token = req.cookies.token;
//     if (!token) {
//       return res.status(401).json({ error: "You must be logged in to use the Help Desk." });
//     }
    
//     // Decode the token to get the user's MongoDB _id
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const userId = decoded.id;

//     const { message } = req.body;
//     if (!message) {
//       return res.status(400).json({ error: "Message cannot be empty." });
//     }

//     console.log(`\n🕵️ [Pre-Scam Bot] Processing message from user: ${userId}`);

//     // 2. SAVE THE USER'S MESSAGE TO MONGODB
//     await Chat.create({
//       user_id: userId,
//       role: 'user',
//       message: message,
//       type: 'pre' // <-- ADD THIS
//     });

//     // 3. FETCH CONTEXT: Get the last 10 messages so the AI remembers the conversation
//     const chatHistory = await Chat.find({ user_id: userId, type: 'pre' }) // <-- FILTER HERE
//     .sort({ createdAt: 1 })
//     .limit(10);

//     // 4. FORMAT FOR GROQ: Groq expects roles to be 'user', 'assistant', or 'system'.
//     // Your database uses 'ai', so we have to map 'ai' to 'assistant' for Groq.
//     const groqMessages = chatHistory.map(chat => ({
//       role: chat.role === 'ai' ? 'assistant' : chat.role,
//       content: chat.message
//     }));

//     // 5. INJECT THE DYNAMIC PROMPT: Tell the AI who it is right now
//     const systemPrompt = {
//       role: 'system',
//       content: `You are an elite Pre-Scam Investigator for ScamShieldAI. 
//       Your job is to analyze suspicious emails, text messages, links, or phone calls the user shares.
      
//       Rules:
//       - Be highly analytical, sharp, and direct.
//       - Point out specific "red flags" (e.g., urgency, weird domains, asking for OTPs).
//       - Do not provide post-scam damage control here. Focus purely on prevention and analysis.
//       - Keep responses concise and formatted with short paragraphs or bullet points.`
//     };
    
//     // Add the system prompt to the very beginning of the array
//     groqMessages.unshift(systemPrompt);

//     // 6. CALL GROQ LLM
//     const chatCompletion = await groq.chat.completions.create({
//       messages: groqMessages,
//       model: "llama-3.1-8b-instant",
//       temperature: 0.4, // Lower temperature keeps it highly analytical and factual
//     });

//     const aiResponse = chatCompletion.choices[0].message.content;

//     // 7. SAVE THE AI'S RESPONSE TO MONGODB
//     await Chat.create({
//       user_id: userId,
//       role: 'ai',
//       message: aiResponse,
//       type: 'pre' // <-- ADD THIS
//     });

//     console.log(`✅ [Pre-Scam Bot] Replied successfully.`);
    
//     // 8. SEND THE RESPONSE BACK TO REACT
//     res.json({ reply: aiResponse });

//   } catch (error) {
//     console.error("🔴 Pre-Scam Chat Error:", error.message);
//     res.status(500).json({ error: "The Investigator is currently offline. Please try again." });
//   }
// });


// ==========================================
// PRE-SCAM AI INVESTIGATOR (HELP DESK)
// ==========================================
// ==========================================
// PRE-SCAM AI INVESTIGATOR (HELP DESK)
// ==========================================
app.post('/api/chat/pre-scam', async (req, res) => {
  try {
    // 1. AUTHENTICATION
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "You must be logged in to use the Help Desk." });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2. VALIDATE INCOMING MESSAGE
    const rawMessage = req.body.message;
    if (!rawMessage) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }
    const safeUserMessage = String(rawMessage).trim();

    console.log(`\n🕵️ [Pre-Scam Bot] Processing message from user: ${userId}`);

    // 3. SAVE THE USER'S MESSAGE FIRST
    await Chat.create({
      user_id: userId,
      role: 'user',
      message: safeUserMessage, 
      type: 'pre' 
    });

    // 4. FETCH CONTEXT (Memory Management)
    // We fetch 11 to get the message we just saved + 10 history points
    const rawHistory = await Chat.find({ user_id: userId, type: 'pre' })
      .sort({ createdAt: -1 }) // Get newest messages first
      .limit(11); 

    // IMPORTANT: Reverse the array so it's in chronological order for the AI
    const chronologicalHistory = rawHistory.reverse();

    // 5. FORMAT FOR GROQ
    const groqMessages = chronologicalHistory.map(chat => ({
      role: chat.role === 'ai' ? 'assistant' : chat.role,
      content: chat.message || ""
    }));

    // 6. INJECT SYSTEM PROMPT AT THE START
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
    
    groqMessages.unshift(systemPrompt);

    // 7. CALL GROQ LLM
    console.log(`[DEBUG] Asking Groq to analyze threat... (History length: ${groqMessages.length})`);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.1-8b-instant",
      temperature: 0.4, 
      max_tokens: 1000 
    });

    // Extract response and handle empty cases
    const aiResponse = chatCompletion.choices[0].message?.content;
    
    if (!aiResponse) {
        console.error("🔴 Groq returned an empty response.");
        return res.status(500).json({ error: "The Investigator is silent. Please try again." });
    }

    const safeAiResponse = String(aiResponse).trim();

    // 8. SAVE THE AI'S RESPONSE TO MONGODB
    await Chat.create({
      user_id: userId,
      role: 'ai',
      message: safeAiResponse, 
      type: 'pre' 
    });

    console.log(`✅ [Pre-Scam Bot] Replied successfully.`);
    
    // 9. SEND RESPONSE TO REACT
    res.json({ reply: safeAiResponse });

  } catch (error) {
    console.error("\n🔴 Pre-Scam Chat Error Details:", error.message);
    res.status(500).json({ error: "The Investigator is currently offline. Please try again." });
  }
});
// ==========================================
// AI HELP DESK - POST-SCAM RECOVERY SUPPORT
// ==========================================
app.post('/api/chat/post-scam', async (req, res) => {
  try {
    // 1. AUTHENTICATION: Verify the user
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "You must be logged in to use the Help Desk." });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    console.log(`\n🛡️ [Post-Scam Bot] Processing crisis message from user: ${userId}`);

    // 2. Save user message to database
    await Chat.create({
      user_id: userId,
      role: 'user',
      message: message,
      type: 'post' // <-- ADD THIS
    });

    // 3. Fetch chat history
    const chatHistory = await Chat.find({ user_id: userId, type: 'post' }) // <-- FILTER HERE
      .sort({ createdAt: 1 })
      .limit(10);

    // 4. Format history for Groq
    const groqMessages = chatHistory.map(chat => ({
      role: chat.role === 'ai' ? 'assistant' : chat.role,
      content: chat.message
    }));

    // 5. THE POST-SCAM SYSTEM PROMPT (Empathetic & Action-Oriented)
    const systemPrompt = {
      role: 'system',
      content: `You are an empathetic Victim Support and Crisis Management Advisor for ScamShieldAI. 
      The user talking to you has likely just been scammed, lost money, or had their identity compromised. They may be panicked or distressed.
      
      Rules:
      1. Tone: Be deeply empathetic, calming, and reassuring. Start by letting them know it is not their fault and you are here to help.
      2. Action: Provide immediate, step-by-step damage control instructions (e.g., freezing bank accounts, changing passwords).
      3. Reporting: Advise them to document the evidence (screenshots) and report the incident to the National Cyber Crime Reporting Portal (cybercrime.gov.in) or by dialing the 1930 helpline.
      4. Formatting: Use clear bullet points and bold text to make your instructions easy to read in a crisis.`
    };
    
    groqMessages.unshift(systemPrompt);

    // 6. Call Groq LLM (Higher temperature for more natural, empathetic language)
    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.1-8b-instant",
      temperature: 0.6, 
    });

    const aiResponse = chatCompletion.choices[0].message.content;

    // 7. Save AI response to database
    await Chat.create({
      user_id: userId,
      role: 'ai',
      message: aiResponse,
       type: 'post'
    });

    console.log(`✅ [Post-Scam Bot] Replied successfully with recovery steps.`);
    
    // 8. Send response to React
    res.json({ reply: aiResponse });

  } catch (error) {
    console.error("🔴 Post-Scam Chat Error:", error.message);
    res.status(500).json({ error: "The Support Advisor is currently offline. Please try again." });
  }
});


// ==========================================
// GET USER CHAT HISTORY
// ==========================================
app.get('/api/chat/history', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "You must be logged in." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 🌟 Grab the 'type' from the URL query string (e.g., ?type=pre)
    const { type } = req.query;

    if (!type || !['pre', 'post'].includes(type)) {
      return res.status(400).json({ error: "Invalid chat type requested." });
    }

    // Filter the database by BOTH user_id and type!
    const chatHistory = await Chat.find({ user_id: userId, type: type }).sort({ createdAt: 1 });

    res.json(chatHistory);

  } catch (error) {
    console.error("🔴 History Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to load chat history." });
  }
});

// ==========================================
// COMMUNITY DATABASE - SUBMIT SCAM REPORT
// ==========================================
app.post('/api/reports', async (req, res) => {
  try {
    // 1. AUTHENTICATION: Check if the user is logged in
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "You must be logged in to submit a report." });
    }
    
    // Decode the token to get the user's ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2. Extract the form data sent from React
    const { category, scammerDetails, description } = req.body;

    // 3. Validation: Ensure all fields are filled out
    if (!category || !scammerDetails || !description) {
      return res.status(400).json({ error: "Please fill out all fields to submit the report." });
    }

    // 4. Save the report to MongoDB
    const newReport = await Report.create({
      user_id: userId,
      category: category,
      scammerDetails: scammerDetails,
      description: description
    });

    console.log(`🚨 New community report added by user: ${userId}`);

    // 5. Send a success message back to the frontend
    res.status(201).json({ 
      message: "Report submitted successfully! Thank you for protecting the community.",
      report: newReport 
    });

  } catch (error) {
    console.error("🔴 Report Submission Error:", error.message);
    res.status(500).json({ error: "Failed to submit report. Please try again later." });
  }
});

// ==========================================
// DYNAMIC AI QUIZ GENERATOR
// ==========================================
app.get('/api/quiz/generate', async (req, res) => {
  try {
    // Optional but recommended: Require login to prevent API spam!
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Please log in to take the quiz." });

    console.log("🧠 Generating 10 new dynamic quiz questions...");

    const systemPrompt = `You are a cybersecurity expert creating a training module. 
    Generate exactly 10 multiple-choice quiz questions about modern digital scams (e.g., phishing, digital arrest, task scams, fake bank alerts).
    
    CRITICAL RULE: You MUST return ONLY a valid JSON object. Do not include markdown, code blocks, or conversational text.
    The JSON object must have a single key called "questions" which contains an array of the 10 question objects.
    
    Structure each object EXACTLY like this:
    {
      "questions": [
        {
          "type": "sms", // Must be "sms", "call", or "email"
          "scenario": "A 1-2 sentence description of the scam scenario.",
          "options": [
            "A plausible but wrong action.",
            "Another wrong action.",
            "The correct, safe action."
          ],
          "correctAnswer": 2, // The integer index (0, 1, or 2) of the correct option
          "explanation": "A 1-2 sentence explanation of why this is the right choice."
        }
      ]
    }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.7, // Gives the AI enough creativity to make interesting scenarios
      response_format: { type: "json_object" } // 🔥 FORCES PERFECT JSON OUTPUT!
    });

    // Parse the AI's string response into an actual JavaScript object
    const rawData = completion.choices[0].message.content;
    const parsedData = JSON.parse(rawData);

    console.log("✅ Quiz generated successfully!");
    
    // Send just the array of questions back to React
    res.json(parsedData.questions);

  } catch (error) {
    console.error("🔴 Quiz Generation Error:", error);
    res.status(500).json({ error: "Failed to generate quiz. Please try again." });
  }
});

// ==========================================
// ADMIN: FETCH ALL REPORTS FOR DASHBOARD
// ==========================================
app.get('/api/admin/reports', async (req, res) => {
  try {
    // 1. AUTHENTICATION & SECURITY: Double-check they are the admin!
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || user.email !== 'admin@gmail.com') {
      return res.status(403).json({ error: "Forbidden: Admin access only." });
    }

    // 2. FETCH ALL REPORTS
    // We use .populate() to grab the user's name and email from the User collection
    // We use .sort({ createdAt: -1 }) to put the newest reports at the top of the table
    const allReports = await Report.find()
      .populate('user_id', 'name email')
      .sort({ createdAt: -1 });

    // 3. SEND TO REACT
    res.json(allReports);

  } catch (error) {
    console.error("🔴 Admin Fetch Reports Error:", error.message);
    res.status(500).json({ error: "Failed to fetch threat database." });
  }
});


// ==========================================
// ADMIN: BATCH VERIFY PENDING REPORTS WITH AI
// ==========================================
app.post('/api/admin/verify-pending', async (req, res) => {
  try {
    // 1. Authenticate Admin
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user.email !== 'admin@gmail.com') return res.status(403).json({ error: "Forbidden" });

    // 2. Fetch Pending Reports
    const pendingReports = await Report.find({ status: 'pending' });
    if (pendingReports.length === 0) {
      return res.json({ message: "No pending reports to verify!", processedCount: 0 });
    }

    let verifiedCount = 0;
    let rejectedCount = 0;

    console.log(`\n🤖 Admin triggered AI Verification for ${pendingReports.length} reports...`);

    // 3. Process each report with Groq LLM
    for (let report of pendingReports) {
      const systemPrompt = `You are an elite AI moderator for a Scam Reporting Database.
      Analyze the community report. Is it a plausible scam (verified) or harmless/spam (rejected)?
      
      You MUST output ONLY valid JSON:
      {
        "status": "verified" or "rejected",
        "reason": "1-sentence explanation"
      }`;

      // Safely handle missing descriptions or categories
      const safeCategory = report.category || 'Unknown';
      const safeDetails = report.scammerDetails || 'None';
      const safeDescription = report.description || 'No description provided';

      const userPrompt = `Category: ${safeCategory}\nDetails: ${safeDetails}\nDescription: ${safeDescription}`;

      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          model: "llama-3.1-8b-instant",
          temperature: 0.1,
          response_format: { type: "json_object" }
        });

        const aiDecision = JSON.parse(completion.choices[0].message.content);

        // A. Update the Report Model
        report.status = aiDecision.status; 
        report.aiReason = aiDecision.reason; 
        await report.save();

        if (aiDecision.status === 'verified') verifiedCount++;
        else rejectedCount++;

        // B. Map the category safely for Machine Learning
        let mlCategory = 'Not sure';
        const lowerCategory = safeCategory.toLowerCase();

        if (lowerCategory.includes('bank') || lowerCategory.includes('financial')) mlCategory = 'Bank';
        else if (lowerCategory.includes('otp')) mlCategory = 'OTP';
        else if (lowerCategory.includes('arrest') || lowerCategory.includes('authority')) mlCategory = 'Digital arrest';

        // C. Save to Temp Dataset for Continuous Learning
        await TempDataset.create({
          message: safeDescription, 
          label: aiDecision.status === 'verified' ? 1 : 0,
          category: mlCategory
        });

        console.log(`💾 Successfully saved report to TempDataset! (Label: ${aiDecision.status === 'verified' ? 1 : 0}, Category: ${mlCategory})`);

      } catch (error) {
        console.error(`🔴 CRITICAL SAVE ERROR on report ${report._id}:`, error); // Prints the full stack trace!
     }
    }

    // ==========================================
    // 4. CONTINUOUS LEARNING TRIGGER
    // ==========================================
    const tempDatasetCount = await TempDataset.countDocuments();
    let retrainingTriggered = false;

    console.log(`📊 Current TempDataset Size: ${tempDatasetCount}/10`);

    // Change this to 2 for quick testing, or 10 for production!
    const THRESHOLD = 2; 

    if (tempDatasetCount >= THRESHOLD) {
      console.log(`🚀 Threshold reached! Triggering Python ML Retraining...`);
      
      try {
        // Fetch all records to send to Python
        const newTrainingData = await TempDataset.find();
        
        // Send data to Python Flask router
        await axios.post('http://127.0.0.1:5000/retrain', {
          data: newTrainingData
        });

        console.log(`✅ Retraining successful! Clearing the TempDataset...`);
        
        // Wipe the temp database clean to start counting again
        await TempDataset.deleteMany({});
        retrainingTriggered = true;

      } catch (retrainError) {
        console.error("🔴 Python Retraining failed:", retrainError.message);
      }
    }

    // 5. Send final response to React
    res.json({ 
      message: `AI Verification Complete! Verified: ${verifiedCount}, Rejected: ${rejectedCount}. ${retrainingTriggered ? `🎉 ${THRESHOLD}+ records reached! AI Model was successfully retrained!` : `(Data points collected: ${tempDatasetCount}/${THRESHOLD})`}`,
      processedCount: pendingReports.length
    });

  } catch (error) {
    console.error("🔴 Admin AI Verification Error:", error.message);
    res.status(500).json({ error: "Failed to run AI verification." });
  }
});

// ==========================================
// ADMIN: PHISHING SIMULATOR ENGINE (CONTINUOUS LEARNING)
// ==========================================
app.post('/api/admin/phish-user', async (req, res) => {
  try {
    // 1. Authenticate Admin (Double-Locked!)
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.email !== 'admin@gmail.com') {
        return res.status(403).json({ error: "Forbidden: Admin access only." });
    }

    const targetEmail = req.body.email;
    if (!targetEmail) return res.status(400).json({ error: "No target email provided." });

    console.log(`\n🚨 Admin triggered a controlled Phishing Attack on: ${targetEmail}`);

    // 2. CONFIGURE NODEMAILER using the secrets from your .env
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SIMULATOR_EMAIL, // Your Gmail address
        pass: process.env.SIMULATOR_PASS  // Your 16-digit App Password
      }
    });

    // 3. COMPILE THE PHISHING PAYLOAD
    // Important: We link them back to the HTML file in your public folder!
    const simulationLink = 'https://media.istockphoto.com/id/177351466/photo/masked-thief-running-away-with-his-loot.jpg?s=1024x1024&w=is&k=20&c=wdoCVhQNFCbb9j1R8ys_CRRhwZ7iwgQGzezs8piz2HA=';

    const mailOptions = {
        from: `"Security Services" <${process.env.SIMULATOR_EMAIL}>`, // Spoof the sender name
        to: targetEmail,
        subject: '⚠️ SECURITY ALERT: Pan Card Verification Required immediately!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #ef4444;">Income Tax Department Notification</h2>
                
                <p>Dear Taxpayer,</p>
                
                <p>Our automated neural system has detected a discrepancy in your PAN Card details linked to your bank account. If you do not verify your information immediately, your bank account will be **frozen within 24 hours** as per RBI guidelines.</p>
                
                <p>Please click the button below to complete the instantaneous KYC verification process.</p>
                
                <a href="${simulationLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0;">Verify PAN Details Now</a>
                
                <p style="font-size: 0.9rem; color: #6b7280;">Thank you,<br>ITD Compliance Team.</p>
                
                <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 20px; text-align: center;">
                    This is an automated security message. Do not reply to this email.
                </div>
            </div>
        `
    };

    // 4. FIRE THE ATTACK!
    await transporter.sendMail(mailOptions);

    console.log(`✅ Phishing simulation email successfully sent to ${targetEmail}.`);
    
    // 5. SEND SUCCESS BACK TO ADMIN PANEL
    res.json({ message: `Phishing Simulation email successfully dispatched to ${targetEmail}!` });

  } catch (error) {
    console.error("🔴 Phishing Simulator Error:", error.message);
    res.status(500).json({ error: "Failed to connect to the email simulation engine." });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Node.js Gateway running on http://localhost:${PORT}`));