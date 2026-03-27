// src/components/TextScanner.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { FiSmartphone, FiShield, FiAlertOctagon, FiCheckCircle, FiCrosshair, FiCpu } from 'react-icons/fi';
import styles from './TextScanner.module.css';

export default function TextScanner() {
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  // Demo messages for the hackathon pitch
  const demoMessages = {
    otp: "Dear Customer, your bank account will be suspended in 15 mins. Please update your PAN card immediately here: http://kyc-update-secure.in/login",
    job: "Congratulations! You have been selected for a remote part-time job. Earn ₹5000 daily. Click the WhatsApp link to contact HR: wa.me/fake-link",
    safe: "Hi mom, I'll be late for dinner tonight. See you around 8 PM!"
  };

  // 🔥 THE REAL BACKEND CONNECTION (AXIOS) 🔥
  const handleScan = async () => {
    if (!inputText.trim()) return;
    
    setIsScanning(true);
    setResult(null);

    try {
      // 1. Send the text to the Node.js Gateway using Axios
      const response = await axios.post('http://localhost:4000/api/scan', {
        message: inputText
      });

      // 2. Axios automatically parses the JSON into response.data!
      const realAiData = response.data;
      
      // 3. Plug it directly into the UI
      setResult(realAiData);

    } catch (error) {
      console.error("Backend connection failed:", error);
      // Fallback UI just in case the servers drop during the demo
      setResult({
        status: 'danger',
        score: 0,
        type: 'Server Disconnected',
        manipulation: ['Offline'],
        explanation: 'Could not connect to the ScamShieldAI neural network. Please ensure the Node.js and Python microservices are running on ports 4000 and 5000.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <h2 className={styles.title}>Live Text Scanner</h2>
        <p className={styles.subtitle}>Paste an SMS, WhatsApp message, or Email below for real-time AI analysis.</p>
      </div>

      <div className={styles.splitView}>
        
        {/* LEFT PANEL: Input Area */}
        <div className={styles.inputPanel}>
          <div className={styles.panelHeader}>
            <FiSmartphone className={styles.panelIcon} />
            <h3>Message Input</h3>
          </div>
          
          <textarea 
            className={styles.textArea}
            placeholder="Paste suspicious message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>

          <button 
            className={styles.scanButton} 
            onClick={handleScan}
            disabled={isScanning || !inputText.trim()}
          >
            {isScanning ? 'Analyzing with AI...' : 'Scan Message'}
          </button>

          {/* Hackathon Demo Injectors */}
          <div className={styles.demoSection}>
            <p>Quick Demo Injectors:</p>
            <div className={styles.demoButtons}>
              <button onClick={() => setInputText(demoMessages.otp)}>Inject OTP Scam</button>
              <button onClick={() => setInputText(demoMessages.job)}>Inject Job Fraud</button>
              <button onClick={() => setInputText(demoMessages.safe)}>Inject Safe Text</button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI Analysis Results */}
        <div className={styles.resultPanel}>
          <div className={styles.panelHeader}>
            <FiCpu className={styles.panelIcon} />
            <h3>AI Analysis Engine</h3>
          </div>

          {/* State 1: Waiting for input */}
          {!isScanning && !result && (
            <div className={styles.emptyState}>
              <FiCrosshair className={styles.emptyIcon} />
              <p>Awaiting message input.</p>
              <span>System is ready to detect psychological manipulation and malicious patterns.</span>
            </div>
          )}

          {/* State 2: Scanning Animation */}
          {isScanning && (
            <div className={styles.scanningState}>
              <div className={styles.radar}></div>
              <p>Deconstructing text patterns...</p>
            </div>
          )}

          {/* State 3: Analysis Results */}
          {!isScanning && result && (
            <div className={`${styles.resultContent} ${styles[result.status]}`}>
              
              <div className={styles.scoreHeader}>
                <div className={styles.scoreCircle}>
                  <span className={styles.scoreNumber}>{result.score}%</span>
                  <span className={styles.scoreLabel}>Threat Level</span>
                </div>
                <div className={styles.resultVerdict}>
                  {result.status === 'danger' && <FiAlertOctagon className={styles.verdictIcon} />}
                  {result.status === 'warning' && <FiAlertOctagon className={styles.verdictIcon} />}
                  {result.status === 'safe' && <FiCheckCircle className={styles.verdictIcon} />}
                  <h3>{result.type}</h3>
                </div>
              </div>

              <div className={styles.analysisBox}>
                <h4>Psychological Manipulation Detected:</h4>
                <div className={styles.tagContainer}>
                  {result.manipulation && result.manipulation.length > 0 ? (
                    result.manipulation.map((tag, idx) => (
                      <span key={idx} className={styles.tag}>{tag}</span>
                    ))
                  ) : (
                    <span className={styles.tag}>None Detected</span>
                  )}
                </div>
              </div>

              <div className={styles.analysisBox}>
                <h4>Why did AI flag this?</h4>
                <p className={styles.explanationText}>{result.explanation}</p>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}