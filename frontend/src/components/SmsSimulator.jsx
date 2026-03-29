// src/components/SmsSimulator.jsx
import React, { useState, useRef } from 'react';
import { FiMessageSquare, FiShield, FiAlertTriangle, FiCheckCircle, FiSend } from 'react-icons/fi';
import styles from './SmsSimulator.module.css';

export default function SmsSimulator() {
  const [activeSms, setActiveSms] = useState(null);
  const [interceptionState, setInterceptionState] = useState('idle'); // idle, analyzing, blocked, safe

  // Create an Audio object reference using a free alarm sound URL
  // You can replace this URL with a local file path like '/alert.mp3' if you put a file in your public folder
  const alertSound = useRef(new Audio('/smsalert.mp3'));
  
  const demoScenarios = [
    {
      id: 1,
      sender: "HDFC-ALERT",
      text: "Dear User, your HDFC bank account will be blocked today due to pending PAN KYC. Update immediately via: http://hdfc-kyc-update.net.in",
      isScam: true,
      threatType: "Phishing / Malicious Link",
      score: 98
    },
    {
      id: 2,
      sender: "Unknown (+91 87654 32109)",
      text: "You have won a cash prize of ₹25,000 from KBC! Send registration fee of ₹999 via UPI to claim your prize.",
      isScam: true,
      threatType: "Advance Fee Fraud",
      score: 85
    },
    {
      id: 3,
      sender: "Mom",
      text: "Can you pick up some groceries on your way back from college?",
      isScam: false,
      threatType: "Safe",
      score: 2
    }
  ];

  const triggerSms = (scenario) => {
    setActiveSms(scenario);
    setInterceptionState('idle');

    // Reset the audio just in case it was playing previously
    alertSound.current.pause();
    alertSound.current.currentTime = 0;

    // Step 1: SMS arrives
    setTimeout(() => {
      setInterceptionState('analyzing');
      
      // Step 2: ScamShieldAI intercepts
      setTimeout(() => {
        if (scenario.isScam) {
          setInterceptionState('blocked');
          
          // PLAY THE ALARM SOUND
          alertSound.current.play().catch(err => console.log("Audio prevented by browser:", err));
          
          // Force stop the sound after 2 seconds
          setTimeout(() => {
            alertSound.current.pause();
            alertSound.current.currentTime = 0;
          }, 2000);

        } else {
          setInterceptionState('safe');
          setTimeout(() => resetSimulator(), 4000);
        }
      }, 1200); 
    }, 500);
  };

  const resetSimulator = () => {
    setActiveSms(null);
    setInterceptionState('idle');
    // Ensure sound stops if they click reset early
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
                disabled={activeSms !== null && interceptionState !== 'safe'}
              >
                <div className={styles.btnIcon}>
                  {scenario.isScam ? <FiAlertTriangle className={styles.redIcon}/> : <FiMessageSquare className={styles.blueIcon}/>}
                </div>
                <div className={styles.btnText}>
                  <strong>{scenario.sender}</strong>
                  <span>{scenario.threatType} Demo</span>
                </div>
                <FiSend className={styles.sendIcon} />
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

              {/* Incoming SMS Notification Toast */}
              {activeSms && (
                <div className={`${styles.notificationToast} ${interceptionState === 'analyzing' ? styles.toastScanning : ''}`}>
                  <div className={styles.toastHeader}>
                    <FiMessageSquare className={styles.toastIcon} />
                    <span>{activeSms.sender}</span>
                    <small>Now</small>
                  </div>
                  <p className={styles.toastBody}>{activeSms.text}</p>
                  
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
                      <p><strong>Type:</strong> {activeSms.threatType}</p>
                      <p><strong>Risk Score:</strong> {activeSms.score}%</p>
                    </div>
                    <p className={styles.warningText}>ScamShieldAI has isolated this malicious notification. Do not click any links.</p>
                    <button className={styles.dismissBtn} onClick={resetSimulator}>Dismiss & Delete</button>
                  </div>
                </div>
              )}

              {interceptionState === 'safe' && (
                <div className={styles.safeOverlay}>
                  <FiCheckCircle className={styles.safeIcon} />
                  <p>Message verified safe.</p>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}