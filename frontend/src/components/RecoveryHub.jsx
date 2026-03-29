// src/components/RecoveryHub.jsx
import React, { useState } from 'react';
import axios from 'axios'; // 🌟 1. Import Axios
import { 
  FiPhoneCall, FiShield, FiAlertTriangle, FiCheckCircle, 
  FiExternalLink, FiLock, FiSend, FiShare2, FiAlertCircle 
} from 'react-icons/fi';
import styles from './RecoveryHub.module.css';

export default function RecoveryHub() {
  const [completedSteps, setCompletedSteps] = useState([]);
  
  const [reportState, setReportState] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState(''); // 🌟 2. Add error state
  
  // 🌟 3. Update formData keys to match the backend exactly
  const [formData, setFormData] = useState({ 
    category: 'Financial / Bank Fraud', // Default to the exact DB string
    scammerDetails: '', 
    description: '' 
  });

  const toggleStep = (stepId) => {
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(completedSteps.filter(id => id !== stepId));
    } else {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  // 🌟 4. Connect to the real backend
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!formData.scammerDetails || !formData.description) return;

    setReportState('submitting');
    setErrorMessage('');
    
    try {
      // Send the data to your Node route
      const response = await axios.post(
        'http://localhost:4000/api/reports',
        formData, // Sends category, scammerDetails, and description
        { withCredentials: true } // CRITICAL: Proves the user is logged in!
      );

      console.log("Report Saved:", response.data);
      setReportState('success');
      
      // Clear the form fields
      setFormData({ category: 'Financial / Bank Fraud', scammerDetails: '', description: '' });
      
      // Reset back to idle after 4 seconds so they can submit another if needed
      setTimeout(() => setReportState('idle'), 4000);

    } catch (error) {
      console.error("Submission Error:", error);
      setReportState('error');
      setErrorMessage(error.response?.data?.error || "Failed to connect to the community database.");
      
      // Go back to idle so they can try again
      setTimeout(() => setReportState('idle'), 4000);
    }
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

          {/* Conditional Rendering for Success/Error States */}
          {reportState === 'success' ? (
            <div className={styles.successState}>
              <FiCheckCircle className={styles.successIcon} />
              <h3 style={{ color: '#10b981', marginTop: '1rem' }}>Report Submitted Successfully!</h3>
              <p>The ScamShieldAI global database has been updated. Thank you for protecting the community.</p>
            </div>
          ) : reportState === 'error' ? (
            <div className={styles.errorState} style={{ textAlign: 'center', padding: '2rem 0' }}>
              <FiAlertCircle className={styles.errorIcon} style={{ fontSize: '3rem', color: '#ef4444' }} />
              <h3 style={{ color: '#ef4444', marginTop: '1rem' }}>Submission Failed</h3>
              <p>{errorMessage}</p>
            </div>
          ) : (
            <form className={styles.reportForm} onSubmit={handleReportSubmit}>
              
              <div className={styles.inputGroup}>
                <label>Scam Category</label>
                <select 
                  className={styles.input}
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {/* 🌟 5. Match the Mongoose Enums EXACTLY */}
                  <option value="Financial / Bank Fraud">Financial / Bank Fraud</option>
                  <option value="Authority Impersonation (CBI/Customs)">Authority Impersonation (CBI/Customs)</option>
                  <option value="Fake Job / Task Scam">Fake Job / Task Scam</option>
                  <option value="Malicious Link / APK">Malicious Link / APK</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Scammer Details (Phone Number, UPI ID, or Link)</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g., +91 98765 43210 or http://fake-link.com"
                  value={formData.scammerDetails}
                  onChange={(e) => setFormData({...formData, scammerDetails: e.target.value})}
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