// src/components/SmsSimulator.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios'; 
import { FiMessageSquare, FiShield, FiAlertTriangle, FiCheckCircle, FiSend, FiLoader } from 'react-icons/fi';
import styles from './SmsSimulator.module.css';

export default function SmsSimulator() {
  const [activeSms, setActiveSms] = useState(null);
  const [interceptionState, setInterceptionState] = useState('idle'); 
  const [aiResult, setAiResult] = useState({ threatType: '', score: 0 });

  const alertSound = useRef(new Audio('/smsalert.mp3'));
  
  const demoScenarios = [
    {
      id: 1,
      sender: "HDFC-ALERT",
      text: "Dear User, your bank account is blocked due to pending PAN KYC. Update immediately at: http://hdfc-kyc.net",
    },
    {
      id: 2,
      sender: "Unknown (+91 8765432109)",
      text: "KBC Lucky Draw! You have won ₹25,00,000. To claim prize, call standard officer Vikram Singh immediately.",
    },
    {
      id: 3,
      sender: "IRCTC-SMS",
      text: "Your ticket for Train 12951 (MMCT-NDLS) is confirmed. Coach A1, Berth 32. Enjoy your journey.",
    }
  ];

  const triggerSms = async (scenario) => {
    setActiveSms(scenario);
    setAiResult({ threatType: '', score: 0 });
    setInterceptionState('idle');

    alertSound.current.pause();
    alertSound.current.currentTime = 0;

    setTimeout(async () => {
      setInterceptionState('analyzing');
      console.log(`📡 Sending message to Neural Net for analysis...`);

      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/analyze-sms`, {
          sender: scenario.sender,
          message: scenario.text
        }, { withCredentials: true });

        const data = response.data;
        console.log("✅ AI Analysis Received:", data);

        setAiResult({
            threatType: data.category_mapped, 
            score: data.ml_score 
        });

        if (data.ml_label === 1) {
          setInterceptionState('blocked');
          
          alertSound.current.play().catch(err => console.log("Audio error:", err));
          
          setTimeout(() => {
            alertSound.current.pause();
            alertSound.current.currentTime = 0;
          }, 3000);

        } else {
          setInterceptionState('safe');
          setTimeout(() => resetSimulator(), 5000);
        }

      } catch (error) {
        console.error("🔴 Connection Error to ScamShield Core:", error);
        setInterceptionState('safe'); 
        setAiResult({ threatType: 'Error: Shield Offline', score: 0 });
      }

    }, 800);
  };

  const resetSimulator = () => {
    setActiveSms(null);
    setInterceptionState('idle');
    setAiResult({ threatType: '', score: 0 });
    alertSound.current.pause();
    alertSound.current.currentTime = 0;
  };

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <h2 className={styles.title}>Real-Time SMS Interceptor</h2>
        <p className={styles.subtitle}>Simulating background OS-level notification scanning and threat blocking.</p>
      </div>

      <div className={styles.workspace}>
        
        {/* LEFT: Control Panel */}
        <div className={styles.controlPanel}>
          <div className={styles.panelHeader}>
            <h3>Simulation Controls</h3>
            <p>Push a live SMS to the target device.</p>
          </div>

          <div className={styles.buttonList}>
            {demoScenarios.map((scenario) => (
              <button 
                key={scenario.id}
                className={styles.scenarioButton}
                onClick={() => triggerSms(scenario)}
                disabled={interceptionState === 'analyzing'}
              >
                <div className={styles.btnIcon}>
                    <FiMessageSquare className={styles.blueIcon}/>
                </div>
                <div className={styles.btnText}>
                  <strong>{scenario.sender}</strong>
                  <span>{scenario.text.substring(0, 30)}...</span>
                </div>
                {interceptionState === 'analyzing' && activeSms?.id === scenario.id ? 
                    <FiLoader className={styles.spinIcon} /> :
                    <FiSend className={styles.sendIcon} />
                }
              </button>
            ))}
          </div>
          
          <button className={styles.resetButton} onClick={resetSimulator}>
            Reset Simulation
          </button>
        </div>

        {/* RIGHT: Target Mobile Device */}
        <div className={styles.deviceWrapper}>
          <div className={styles.mobilePhone}>
            <div className={styles.notch}></div>
            <div className={styles.screen}>
              
              <div className={styles.osHeader}>
                <span>9:41</span> 
                <div className={styles.osIcons}>
                  <span className={styles.signal}>ılı</span>
                  <span>100%</span>
                </div>
              </div>

              {/* 🌟 UPDATED: Incoming SMS Notification Toast (Turns RED on block) */}
              {activeSms && (
                <div 
                  className={`${styles.notificationToast} ${interceptionState === 'analyzing' ? styles.toastScanning : ''}`}
                  style={interceptionState === 'blocked' ? { 
                    borderLeft: '4px solid #ef4444', 
                    backgroundColor: '#fef2f2',
                    borderColor: '#fca5a5'
                  } : {}}
                >
                  <div className={styles.toastHeader}>
                    {/* Icon turns red */}
                    {interceptionState === 'blocked' ? 
                      <FiAlertTriangle style={{ color: '#ef4444', fontSize: '1.2rem' }} /> : 
                      <FiMessageSquare className={styles.toastIcon} />
                    }
                    {/* Sender text turns red */}
                    <span style={interceptionState === 'blocked' ? { color: '#ef4444', fontWeight: 'bold' } : {}}>
                      {activeSms.sender}
                    </span>
                    <small style={interceptionState === 'blocked' ? { color: '#ef4444' } : {}}>Now</small>
                  </div>
                  {/* Body text turns dark red */}
                  <p 
                    className={styles.toastBody} 
                    style={interceptionState === 'blocked' ? { color: '#991b1b', fontWeight: '500' } : {}}
                  >
                    {activeSms.text}
                  </p>
                  
                  {interceptionState === 'analyzing' && (
                    <div className={styles.laserScanner}></div>
                  )}
                </div>
              )}

              {/* SCAMSHIELD INTERCEPTION OVERLAY */}
              {interceptionState === 'blocked' && (
                <div className={styles.shieldOverlay}>
                  <div className={styles.shieldContent}>
                    <div className={styles.pulseRing}>
                      <FiShield className={styles.shieldIcon} />
                    </div>
                    <h2>THREAT BLOCKED</h2>
                    <div className={styles.threatDetails}>
                      <p><strong>Detected As:</strong> {aiResult.threatType}</p>
                      <p><strong>Neural Score:</strong> {aiResult.score}%</p>
                    </div>
                    <p className={styles.warningText}>ScamShieldAI has isolated this malicious notification. Background activity suspended.</p>
                    <button className={styles.dismissBtn} onClick={resetSimulator}>Dismiss</button>
                  </div>
                </div>
              )}

              {/* Safe Overlay */}
              {interceptionState === 'safe' && (
                <div className={styles.safeOverlay}>
                  <FiCheckCircle className={styles.safeIcon} />
                  <p>{aiResult.threatType === '' ? 'Message verified safe.' : `${aiResult.threatType} check passed.`}</p>
                </div>
              )}

            </div>
          </div>
        </div> 

      </div>
    </div>
  );
}