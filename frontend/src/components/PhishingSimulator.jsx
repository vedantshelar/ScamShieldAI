import React, { useState } from 'react';
import axios from 'axios';
import { FiMail, FiSend, FiShield, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import styles from './PhishingSimulator.module.css';

export default function PhishingSimulator() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setStatus({ type: 'error', msg: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', msg: '🛰️ Deploying phishing payload...' });

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/phish-user`, 
        { email }, 
        { withCredentials: true }
      );
      setStatus({ type: 'success', msg: response.data.message });
      setEmail('');
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Simulation engine failure.";
      setStatus({ type: 'error', msg: `🔴 ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconHeader}>
          <div className={styles.iconCircle}>
            <FiMail />
          </div>
          <h2>Phishing Simulation Engine</h2>
          <p>Launch controlled, educational phishing attacks to train your users.</p>
        </div>

        <form onSubmit={handleLaunch} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Target User Email</label>
            <input 
              type="email" 
              placeholder="e.g., employee@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className={styles.launchBtn}>
            {loading ? 'Attacking...' : <><FiSend /> Launch Attack</>}
          </button>
        </form>

        {status.msg && (
          <div className={`${styles.status} ${styles[status.type]}`}>
            {status.type === 'error' ? <FiAlertTriangle /> : <FiInfo />}
            {status.msg}
          </div>
        )}

        <div className={styles.footerInfo}>
            <h4><FiShield /> Why use Phishing Simulations?</h4>
            <ul>
                <li>Tests user vigilance in a safe, controlled environment.</li>
                <li>Provides immediate "Teachable Moments" upon link click.</li>
                <li>Reduces the organization's overall risk to social engineering.</li>
            </ul>
        </div>
      </div>
    </div>
  );
}