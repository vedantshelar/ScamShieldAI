// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  return (
    <div className={styles.pageContainer}>

      {/* Decorative Animated Background Blobs */}
      <div className={styles.blobOrange}></div>
      <div className={styles.blobLight}></div>

      {/* Clean Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>🛡️ ScamShieldAI</div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navItem}>Features</a>
          <a href="#tech" className={styles.navItem}>Technology</a>
          <a href="#team" className={styles.navItem}>Our Team</a>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className={styles.heroSection}>

        {/* Left Side: Copy and Call to Actions */}
        <div className={styles.heroContent}>
          <div className={styles.badge}>Live Hackathon Project</div>
          <h1 className={styles.title}>
            Next-Gen Protection Against <br />
            <span className={styles.highlight}>Cyber Fraud.</span>
          </h1>
          <p className={styles.subtitle}>
            Detect scams using multi-modal AI. Analyze SMS, images, and voice in real-time before the damage is done.
          </p>
          <div className={styles.buttonGroup}>
            <Link to="/auth" className={styles.primaryButton}>
              Get Started Securely
            </Link>
            <a href="#demo" className={styles.secondaryButton}>
              Watch Demo
            </a>
          </div>
        </div>

        {/* Right Side: Fancy Floating AI Mockup Card */}
        <div className={styles.heroVisual}>
          <div className={styles.floatingCard}>
            <div className={styles.cardHeader}>
              <span className={styles.dotRed}></span>
              <span className={styles.dotYellow}></span>
              <span className={styles.dotGreen}></span>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.alertText}>⚠️ High Risk: OTP Scam Detected</p>
              <p className={styles.mockupMessage}>
                "Dear user, your electricity will be cut at 9 PM. Click here to update bill..."
              </p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill}></div>
              </div>
              <p className={styles.scoreText}>Threat Score: 98%</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}