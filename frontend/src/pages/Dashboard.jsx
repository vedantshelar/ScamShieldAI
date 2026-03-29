// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiMessageSquare, FiCamera, FiShield, FiLogOut, 
  FiPieChart, FiCpu, FiSmartphone, FiAward, 
  FiDatabase, FiSend, FiMail 
} from 'react-icons/fi';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. AUTHENTICATION CHECK
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/check`, {
          withCredentials: true 
        });
        setUser(response.data.user);
      } catch (err) {
        console.error("Not authenticated, redirecting to auth.");
        navigate('/auth'); 
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const isActive = (path) => {
    return location.pathname === path || location.pathname === `/dashboard${path}`;
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/auth/logout', {}, { withCredentials: true });
      navigate('/'); 
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Initializing Shield...</div>;

  const isAdmin = user?.email === 'admin@gmail.com';

  // 2. ROLE-BASED URL PROTECTION
  // If a normal user tries to access admin routes
  if (!isAdmin && (location.pathname === '/dashboard/admin' || location.pathname === '/dashboard/phish-simulator')) {
    return <Navigate to="/dashboard/overview" replace />;
  }
  
  // If admin tries to access user tools (keeps them on the Admin Panel)
  if (isAdmin && location.pathname === '/dashboard/overview') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return (
    <div className={styles.dashboardLayout}>

      <aside className={styles.sidebar}>
        <div className={styles.brandContainer}>
          <Link to="/" className={styles.brandTitle}>
            <FiShield style={{ marginRight: '8px' }} /> ScamShieldAI
          </Link>
        </div>

        <nav className={styles.navMenu}>
          {isAdmin ? (
            // =====================================
            // ADMIN VIEW: SECURITY TOOLS
            // =====================================
            <>
              <Link to="/dashboard/admin" className={isActive('/dashboard/admin') ? styles.activeLink : styles.navLink}>
                <span className={styles.icon}><FiDatabase /></span> Threat Database
              </Link>

              <Link to="/dashboard/phish-simulator" className={isActive('/dashboard/phish-simulator') ? styles.activeLink : styles.navLink}>
                <span className={styles.icon}><FiSend /></span> Phishing Simulator
              </Link>
            </>

          ) : (
            // =====================================
            // NORMAL USER VIEW: PROTECTION TOOLS
            // =====================================
            <>
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
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '10px', padding: '0 20px' }}>
            Logged in as: <br/><strong style={{color: '#fff'}}>{user?.email}</strong>
          </div>
          <button className={styles.exitButton} onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}>
            <FiLogOut style={{ marginRight: '8px', display: 'inline' }} /> Exit Dashboard
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <Outlet />
      </main>

    </div>
  );
}