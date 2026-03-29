// src/components/Overview.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiShield, FiAlertTriangle, FiCheckCircle, FiTrendingUp, FiLoader } from 'react-icons/fi';
import styles from './Overview.module.css';

export default function Overview() {
  // 1. Setup State
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch Data from Backend on Load
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/overview`, {
          withCredentials: true // Important if you use JWT cookies
        });
        setData(response.data);
      } catch (error) {
        console.error("Failed to load dynamic dashboard data", error);
        // Fallback data just in case the API is slow or down during the hackathon!
        setData({
          liveFeed: [
            { risk: "High", title: "API Offline", desc: "Could not reach Threat Intelligence Engine.", time: "Now" }
          ],
          trends: [
            { name: "System Offline", percentage: 100 }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 3. Render Loading State
  if (isLoading) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <FiLoader className={styles.spinIcon} style={{ fontSize: '3rem', color: '#ff5e00', marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ color: '#ffffff' }}>Compiling Global Threat Intelligence...</h3>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 4. Color Palette for Dynamic Progress Bars
  const trendColors = [
    'linear-gradient(90deg, #ff8a00, #ff5e00)', // Top threat: Orange Gradient
    '#ff5f56', // 2nd: Red
    '#ffbd2e', // 3rd: Yellow
    '#27c93f'  // 4th: Green
  ];

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

      {/* Main Content Split */}
      <div className={styles.contentSplit}>
        
        {/* Left Column: Live Threat Feed */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Live Threat Feed</h3>
            <button className={styles.viewAllBtn}>View Log</button>
          </div>
          
          <div className={styles.feedList}>
            {/* 🌟 DYNAMIC MAP: Loop through Groq's Live Feed Array */}
            {data.liveFeed.map((item, index) => (
              <div className={styles.feedItem} key={index}>
                <div className={item.risk === 'High' ? styles.feedIconRed : styles.feedIconOrange}>
                  {item.risk === 'High' ? <FiAlertTriangle /> : <FiTrendingUp />}
                </div>
                <div className={styles.feedText}>
                  <h4>{item.risk} Risk: {item.title}</h4>
                  <p>{item.desc}</p>
                </div>
                <span className={styles.feedTime}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Scam Trends Breakdown */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Top Scam Categories</h3>
          </div>
          
          <div className={styles.categoryList}>
            {/* 🌟 DYNAMIC MAP: Loop through Groq's Trends Array */}
            {data.trends.map((trend, index) => (
              <div className={styles.categoryItem} key={index}>
                <div className={styles.categoryMeta}>
                  <span>{trend.name}</span>
                  <span className={styles.percentage}>{trend.percentage}%</span>
                </div>
                <div className={styles.progressBarBg}>
                  {/* Inline styles calculate the width and apply the color from our array! */}
                  <div 
                    className={styles.progressBarFill} 
                    style={{ 
                      width: `${trend.percentage}%`, 
                      background: trendColors[index % trendColors.length] 
                    }}>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
        </div>

      </div>
    </div>
  );
}