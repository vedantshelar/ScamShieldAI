// src/pages/Dashboard.jsx
import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
// IMPORT NEW ICONS
import { FiMessageSquare, FiCamera, FiShield, FiLogOut, FiPieChart, FiCpu, FiSmartphone, FiAward, FiDatabase } from 'react-icons/fi';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path || location.pathname === `/dashboard${path}`;
  };

  const handleLogout = async () => {
    try {
      // 1. Tell the backend to destroy the cookie
      await axios.post('http://localhost:4000/api/auth/logout', {}, {
        withCredentials: true 
      });
       
      // 2. Send the user back to the home page or auth page
      navigate('/'); 
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  return (
    <div className={styles.dashboardLayout}>

      {/* Sleek Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.brandContainer}>
          <Link to="/" className={styles.brandTitle}>
            <FiShield style={{ marginRight: '8px' }} /> ScamShieldAI
          </Link>
        </div>

        <nav className={styles.navMenu}>

          <Link to="/dashboard/overview" className={isActive('/dashboard/overview') ? styles.activeLink : styles.navLink}>
            <span className={styles.icon}><FiPieChart /></span> Threat Overview
          </Link>

          <Link to="/dashboard/scanner" className={isActive('/dashboard/scanner') ? styles.activeLink : styles.navLink}>
            <span className={styles.icon}><FiMessageSquare /></span> Live Text Scanner
          </Link>

          <Link to="/dashboard/media" className={isActive('/dashboard/media') ? styles.activeLink : styles.navLink}>
            <span className={styles.icon}><FiCamera /></span> Media Analyzer
          </Link>

          <Link to="/dashboard/assistant" className={isActive('/dashboard/assistant') ? styles.activeLink : styles.navLink}>
            <span className={styles.icon}><FiCpu /></span> AI Help Desk
          </Link>

          <Link to="/dashboard/recovery" className={isActive('/dashboard/recovery') ? styles.activeLink : styles.navLink}>
            <span className={styles.icon}><FiShield /></span> Recovery Hub
          </Link>

          <Link to="/dashboard/simulator" className={isActive('/dashboard/simulator') ? styles.activeLink : styles.navLink}>
            <span className={styles.icon}><FiSmartphone /></span> Live SMS Interceptor
          </Link>

          <Link to="/dashboard/quiz" className={isActive('/dashboard/quiz') ? styles.activeLink : styles.navLink}>
            <span className={styles.icon}><FiAward /></span> ScamSpotter Quiz
          </Link>

          <Link to="/dashboard/admin" className={isActive('/dashboard/admin') ? styles.activeLink : styles.navLink}>
            <span className={styles.icon}><FiDatabase /></span> Threat Database (Admin)
          </Link>

        </nav>

        {/* Bottom exit area */}
        <div className={styles.sidebarFooter}>
          <Link className={styles.exitButton} onClick={handleLogout}>
            <FiLogOut style={{ marginRight: '8px', display: 'inline' }} /> Exit Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content Area - Now 100% dedicated to the Outlet */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

    </div>
  );
}