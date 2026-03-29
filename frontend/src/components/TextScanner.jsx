// src/components/TextScanner.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { FiSmartphone, FiShield, FiAlertOctagon, FiCheckCircle, FiCrosshair, FiCpu } from 'react-icons/fi';
import styles from './TextScanner.module.css';

export default function TextScanner() {
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  const demoMessages = {
    otp: "Dear Customer, your Airtel SIM will be blocked in 24 hrs. Please reply with the OTP 8493 to verify your KYC.",
    job: "Congratulations! You have been selected for a remote part-time job. Earn ₹5000 daily. Click the WhatsApp link to contact HR: wa.me/fake-link",
    bank: "URGENT: Your HDFC bank account will be suspended today. Update KYC PAN immediately: http://hdfc-kyc-update.net",
    da: "CBI Alert: Your Aadhaar is linked to money laundering. Join Skype video call immediately for interrogation.",
    safe: "Hi mom, I'll be late for dinner tonight. See you around 8 PM!"
  };

  const handleScan = async () => {
    if (!inputText.trim()) return;
    
    setIsScanning(true);
    setResult(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/scan`, {
        message: inputText
      });

      const realAiData = response.data;
      setResult(realAiData);

    } catch (error) {
      console.error("Backend connection failed:", error);
      setResult({
        status: 'danger',
        score: 0,
        type: 'Server Disconnected',
        manipulation: ['Offline'],
        explanation: 'Could not connect to the ScamShieldAI neural network. Please ensure the Node.js and Python microservices are running on ports 4000 and 5000.',
        recovery_steps: ['Check Node.js console', 'Check Python Flask console'], // Fallback steps
        expert_used: 'None'
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
        
        {/* LEFT PANEL */}
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
            {isScanning ? 'Auto-Detecting & Analyzing...' : 'Scan Message'}
          </button>

          <div className={styles.demoSection}>
            <p>Quick Demo Injectors:</p>
            <div className={styles.demoButtons} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button onClick={() => setInputText(demoMessages.bank)}>Inject Bank Fraud</button>
              <button onClick={() => setInputText(demoMessages.da)}>Inject Digital Arrest</button>
              <button onClick={() => setInputText(demoMessages.otp)}>Inject OTP Scam</button>
              <button onClick={() => setInputText(demoMessages.job)}>Inject Job Fraud</button>
              <button onClick={() => setInputText(demoMessages.safe)}>Inject Safe Text</button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className={styles.resultPanel}>
          <div className={styles.panelHeader}>
            <FiCpu className={styles.panelIcon} />
            <h3>AI Analysis Engine</h3>
          </div>

          {!isScanning && !result && (
            <div className={styles.emptyState}>
              <FiCrosshair className={styles.emptyIcon} />
              <p>Awaiting message input.</p>
              <span>System is ready to detect psychological manipulation and malicious patterns.</span>
            </div>
          )}

          {isScanning && (
            <div className={styles.scanningState}>
              <div className={styles.radar}></div>
              <p>Groq AI is auto-routing your message to the correct Expert Model...</p>
            </div>
          )}

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

              <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FiShield /> Scored by: <strong>{result.expert_used === 'Not sure' ? 'General Threat' : result.expert_used} Expert Model</strong>
              </div>

              <div className={styles.analysisBox} style={{ marginTop: '1rem' }}>
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

              {/* 🌟 NEW: RECOVERY STEPS (Only show if it's a scam and steps exist) */}
              {(result.status === 'danger' || result.status === 'warning') && result.recovery_steps && result.recovery_steps.length > 0 && (
                <div className={styles.analysisBox} style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5' }}>
                  <h4 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiShield />Immdediate Recovery Steps:
                  </h4>
                  <ul style={{ paddingLeft: '20px', color: '#7f1d1d', marginTop: '8px', fontSize: '0.95rem' }}>
                    {result.recovery_steps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}