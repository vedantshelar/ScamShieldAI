// src/components/RecoveryHub.jsx
import React, { useState } from 'react';
import { 
  FiPhoneCall, FiShield, FiAlertTriangle, FiCheckCircle, 
  FiExternalLink, FiLock, FiSend, FiShare2 
} from 'react-icons/fi';
import styles from './RecoveryHub.module.css';

export default function RecoveryHub() {
  // State for the interactive checklist
  const [completedSteps, setCompletedSteps] = useState([]);
  
  // State for the Community Reporting Form
  const [reportState, setReportState] = useState('idle'); // idle, submitting, success
  const [formData, setFormData] = useState({ type: 'financial', details: '', description: '' });

  const toggleStep = (stepId) => {
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(completedSteps.filter(id => id !== stepId));
    } else {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!formData.details || !formData.description) return;

    setReportState('submitting');
    
    // Simulate database upload for the demo
    setTimeout(() => {
      setReportState('success');
      setFormData({ type: 'financial', details: '', description: '' });
      
      // Reset back to idle after 3 seconds
      setTimeout(() => setReportState('idle'), 3000);
    }, 1500);
  };

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Recovery & Action Hub</h2>
          <p className={styles.subtitle}>Emergency contacts, lockdown steps, and community reporting.</p>
        </div>
      </div>

      {/* EMERGENCY BANNER */}
      <div className={styles.emergencyBanner}>
        <div className={styles.emergencyInfo}>
          <div className={styles.emergencyIcon}><FiAlertTriangle /></div>
          <div>
            <h3>Have you lost money or shared sensitive data?</h3>
            <p>Do not panic. Act immediately to freeze your accounts and report the fraud to national authorities.</p>
          </div>
        </div>
        <div className={styles.emergencyActions}>
          <a href="tel:1930" className={styles.callButton}>
            <FiPhoneCall /> Dial 1930 (Cyber Helpline)
          </a>
          <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className={styles.portalButton}>
            Cybercrime Portal <FiExternalLink />
          </a>
        </div>
      </div>

      <div className={styles.mainGrid}>
        
        {/* LEFT COLUMN: Interactive Lockdown Checklist */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FiLock className={styles.cardIconRed} />
            <h3 className={styles.cardTitle}>Immediate Lockdown Steps</h3>
          </div>
          <p className={styles.cardDesc}>Complete these steps immediately to prevent further access.</p>

          <div className={styles.checklist}>
            
            <label className={`${styles.checkItem} ${completedSteps.includes(1) ? styles.completed : ''}`}>
              <input type="checkbox" checked={completedSteps.includes(1)} onChange={() => toggleStep(1)} />
              <div className={styles.checkContent}>
                <h4>Disconnect from the Internet</h4>
                <p>Turn on Airplane Mode or turn off Wi-Fi/Mobile Data to stop background malware or remote access.</p>
              </div>
            </label>

            <label className={`${styles.checkItem} ${completedSteps.includes(2) ? styles.completed : ''}`}>
              <input type="checkbox" checked={completedSteps.includes(2)} onChange={() => toggleStep(2)} />
              <div className={styles.checkContent}>
                <h4>Freeze Bank Accounts & Cards</h4>
                <p>Call your bank's 24/7 fraud department using the number on the back of your card. Do not search for the number on Google.</p>
              </div>
            </label>

            <label className={`${styles.checkItem} ${completedSteps.includes(3) ? styles.completed : ''}`}>
              <input type="checkbox" checked={completedSteps.includes(3)} onChange={() => toggleStep(3)} />
              <div className={styles.checkContent}>
                <h4>Change Critical Passwords</h4>
                <p>Using a *different*, safe device, change the passwords for your primary Email and Banking apps.</p>
              </div>
            </label>

            <label className={`${styles.checkItem} ${completedSteps.includes(4) ? styles.completed : ''}`}>
              <input type="checkbox" checked={completedSteps.includes(4)} onChange={() => toggleStep(4)} />
              <div className={styles.checkContent}>
                <h4>Block & Report the Scammer</h4>
                <p>Block the contact on WhatsApp/Phone and report the number as spam to your carrier.</p>
              </div>
            </label>

          </div>
        </div>

        {/* RIGHT COLUMN: Community Reporting Form */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FiShare2 className={styles.cardIconOrange} />
            <h3 className={styles.cardTitle}>Report to Community Database</h3>
          </div>
          <p className={styles.cardDesc}>Your report updates our AI model globally to protect other users instantly.</p>

          {reportState === 'success' ? (
            <div className={styles.successState}>
              <FiCheckCircle className={styles.successIcon} />
              <h3>Report Submitted Successfully!</h3>
              <p>The ScamShieldAI global database has been updated. Thank you for protecting the community.</p>
            </div>
          ) : (
            <form className={styles.reportForm} onSubmit={handleReportSubmit}>
              
              <div className={styles.inputGroup}>
                <label>Scam Category</label>
                <select 
                  className={styles.input}
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="financial">Financial / Bank Fraud</option>
                  <option value="impersonation">Authority Impersonation (CBI/Customs)</option>
                  <option value="job">Fake Job / Task Scam</option>
                  <option value="phishing">Malicious Link / APK</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Scammer Details (Phone Number, UPI ID, or Link)</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g., +91 98765 43210 or http://fake-link.com"
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Briefly describe what happened</label>
                <textarea 
                  className={styles.textArea} 
                  placeholder="They called claiming my FedEx package was seized..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={reportState === 'submitting'}
              >
                {reportState === 'submitting' ? 'Uploading to AI Database...' : <><FiSend /> Submit Threat Data</>}
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}