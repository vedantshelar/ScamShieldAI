// src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react'; // <-- ADDED useEffect
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiMail, FiLock, FiUser, FiShield, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // NEW STATE: Prevents the form from showing while we ask the server if they are logged in
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); 

  // ==========================================
  // AUTO-REDIRECT LOGIC
  // ==========================================
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Ask Node if we have a valid HTTP-Only cookie
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/check`, { 
          withCredentials: true 
        });
        
        // If the request succeeds, it means they are logged in! Redirect instantly.
        navigate('/dashboard');
      } catch (err) {
        // If it fails (401 Unauthorized), they are NOT logged in. Show the form.
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!isLogin) {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, 
          { name, email, password }, 
          { withCredentials: true }
        );
        navigate('/dashboard');
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, 
          { email, password }, 
          { withCredentials: true }
        );
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred connecting to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // While waiting for Node to respond, show a blank screen (or a cool loading spinner!)
  if (isCheckingAuth) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#10b981' }}>
        <h2>Verifying Secure Session...</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgGlow}></div>
      <div className={styles.authCard}>
        {/* ... (The rest of your JSX remains exactly the same!) ... */}
        
        <div className={styles.brandHeader}>
          <div className={styles.shieldIcon}><FiShield /></div>
          <h2>ScamShieldAI</h2>
          <p>{isLogin ? 'Welcome back to your secure hub.' : 'Create your defense account.'}</p>
        </div>

        <div className={styles.toggleContainer}>
          <button 
            className={isLogin ? styles.activeToggle : styles.inactiveToggle}
            onClick={() => { setIsLogin(true); setError(null); }}
            type="button"
          >
            Log In
          </button>
          <button 
            className={!isLogin ? styles.activeToggle : styles.inactiveToggle}
            onClick={() => { setIsLogin(false); setError(null); }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage} style={{ color: 'red', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <FiAlertCircle /> {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <div className={styles.inputWrapper}>
                <FiUser className={styles.inputIcon} />
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.inputIcon} />
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.inputIcon} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          {isLogin && (
            <div className={styles.forgotPassword}>
              <a href="#!">Forgot password?</a>
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Access Dashboard' : 'Create Account')} <FiArrowRight />
          </button>

        </form>

        <div className={styles.backToHome}>
          <Link to="/">← Back to Home</Link>
        </div>

      </div>
    </div>
  );
}