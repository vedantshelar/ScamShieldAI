import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  return (
    <div className={styles.pageContainer}>

      {/* Modern Background */}
      <div className={styles.bgGrid}></div>
      <div className={styles.blobHero}></div>
      <div className={styles.blobHeroSecondary}></div>

      {/* Floating Modern Navbar */}
      <nav className={styles.navbarContainer}>
        <div className={styles.navbar}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🛡️</span>
            ScamShield<span className={styles.logoHighlight}>AI</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#features" className={styles.navItem}>Features</a>
            <a href="#tech" className={styles.navItem}>How it works</a>
            <a href="#metrics" className={styles.navItem}>Impact</a>
          </div>
          <div className={styles.navActions}>
            <Link to="/auth" className={styles.navBtn}>Login / Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Main Hero Layout */}
      <main className={styles.heroSection}>
        
        {/* Text Content Block */}
        <div className={styles.heroContent}>
          <div className={styles.badgeWrapper}>
            <div className={styles.pulseDot}></div>
            <span className={styles.badgeText}>Live Hackathon Build</span>
          </div>
          
          <h1 className={styles.title}>
            Next-Gen Protection Against <br />
            <span className={styles.gradientText}>Cyber Fraud.</span>
          </h1>
          
          <p className={styles.subtitle}>
            Empower your digital life with multi-modal AI. We analyze SMS, images, and voice calls in real-time to trap scams before they trap you.
          </p>

          <div className={styles.buttonGroup}>
            <Link to="/auth" className={styles.primaryButton}>
              Start Protecting Now
              <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </Link>
            <a href="#demo" className={styles.secondaryButton}>
              <svg className={styles.playIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Watch live demo
            </a>
          </div>
          
          <div className={styles.trustStats}>
             <div className={styles.stat}>
                <h4>99.8%</h4>
                <p>Detection Rate</p>
             </div>
             <div className={styles.statDivider}></div>
             <div className={styles.stat}>
                <h4>&lt;50ms</h4>
                <p>Analysis Speed</p>
             </div>
             <div className={styles.statDivider}></div>
             <div className={styles.stat}>
                <h4>3-Modal</h4>
                <p>Vision, Text & Voice</p>
             </div>
          </div>
        </div>

        {/* Dynamic Mockup Composition */}
        <div className={styles.heroVisuals}>
          
          {/* Base Phone Outline */}
          <div className={styles.phoneMockup}>
            <div className={styles.phoneNotch}></div>
            
            <div className={styles.mockupHeader}>
               <span className={styles.appTitle}>Incoming MSG</span>
               <span className={styles.timeLabel}>Just now</span>
            </div>

            <div className={styles.messageBubble}>
              <p>"URGENT: Your bank account is locked. Click here to verify via OTP to restore access: http://secure-bank-alerts.net/login"</p>
            </div>

            {/* AI scanning overlay overlapping */}
            <div className={styles.aiScannerCard}>
              <div className={styles.scannerTop}>
                <div className={styles.scanIconWrapper}>
                   <svg className={styles.scanIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div className={styles.scanHeaders}>
                  <h5 className={styles.alertText}>Phishing Attempt</h5>
                  <p className={styles.scanStatus}>Blocked instantly</p>
                </div>
              </div>
              
              <div className={styles.metricsRow}>
                 <div className={styles.metric}>
                   <span>Link Check</span>
                   <span className={styles.dangerLabel}>Malicious</span>
                 </div>
                 <div className={styles.metric}>
                   <span>Threat Score</span>
                   <span className={styles.scoreNumber}>98/100</span>
                 </div>
              </div>
              
              <div className={styles.scanProgress}>
                 <div className={styles.scanProgressFill}></div>
              </div>
            </div>

          </div>

          {/* Floating Accents */}
          <div className={styles.floatingAccent1}>
             <span className={styles.emoji}>🔒</span> Always-on Security
          </div>
          <div className={styles.floatingAccent2}>
             <div className={styles.dotGreen}></div> Connection Secure
          </div>

        </div>

      </main>
    </div>
  );
}