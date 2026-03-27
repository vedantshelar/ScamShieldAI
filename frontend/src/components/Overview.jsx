// src/components/Overview.jsx
import React from 'react';
import { FiShield, FiAlertTriangle, FiActivity, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import styles from './Overview.module.css';

export default function Overview() {
  return (
    <div className={styles.container}>
      
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>System Overview</h2>
          <p className={styles.subtitle}>Real-time analytics and active threat monitoring.</p>
        </div>
        <div className={styles.statusBadge}>
          <span className={styles.pulseDot}></span>
          System Active
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.iconWrapperOrange}><FiActivity /></div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Messages Scanned</p>
            <h3 className={styles.statValue}>12,450</h3>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.iconWrapperRed}><FiAlertTriangle /></div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Threats Detected</p>
            <h3 className={styles.statValue}>342</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconWrapperGreen}><FiCheckCircle /></div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Scams Blocked</p>
            <h3 className={styles.statValue}>338</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconWrapperBlue}><FiShield /></div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Protection Score</p>
            <h3 className={styles.statValue}>98.5%</h3>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className={styles.contentSplit}>
        
        {/* Left Column: Live Threat Feed */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Live Threat Feed</h3>
            <button className={styles.viewAllBtn}>View Log</button>
          </div>
          <div className={styles.feedList}>
            <div className={styles.feedItem}>
              <div className={styles.feedIconRed}><FiAlertTriangle /></div>
              <div className={styles.feedText}>
                <h4>High Risk: Digital Arrest Scam</h4>
                <p>Voice call intercepted matching CBI impersonation patterns.</p>
              </div>
              <span className={styles.feedTime}>Just now</span>
            </div>
            
            <div className={styles.feedItem}>
              <div className={styles.feedIconOrange}><FiTrendingUp /></div>
              <div className={styles.feedText}>
                <h4>Medium Risk: Fake Job Offer</h4>
                <p>WhatsApp message containing suspicious Telegram link.</p>
              </div>
              <span className={styles.feedTime}>2m ago</span>
            </div>

            <div className={styles.feedItem}>
              <div className={styles.feedIconRed}><FiAlertTriangle /></div>
              <div className={styles.feedText}>
                <h4>High Risk: OTP Phishing</h4>
                <p>SMS claiming "Bank KYC Suspended" with malicious URL.</p>
              </div>
              <span className={styles.feedTime}>15m ago</span>
            </div>
          </div>
        </div>

        {/* Right Column: Scam Trends Breakdown */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Top Scam Categories</h3>
          </div>
          <div className={styles.categoryList}>
            
            <div className={styles.categoryItem}>
              <div className={styles.categoryMeta}>
                <span>Financial/OTP Phishing</span>
                <span className={styles.percentage}>45%</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: '45%', background: 'linear-gradient(90deg, #ff8a00, #ff5e00)' }}></div>
              </div>
            </div>

            <div className={styles.categoryItem}>
              <div className={styles.categoryMeta}>
                <span>Digital Arrest / Impersonation</span>
                <span className={styles.percentage}>30%</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: '30%', background: '#ff5f56' }}></div>
              </div>
            </div>

            <div className={styles.categoryItem}>
              <div className={styles.categoryMeta}>
                <span>Fake Job Offers</span>
                <span className={styles.percentage}>15%</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: '15%', background: '#ffbd2e' }}></div>
              </div>
            </div>

            <div className={styles.categoryItem}>
              <div className={styles.categoryMeta}>
                <span>Malicious APKs</span>
                <span className={styles.percentage}>10%</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: '10%', background: '#27c93f' }}></div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}