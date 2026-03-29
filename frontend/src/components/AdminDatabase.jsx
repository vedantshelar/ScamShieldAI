// src/components/AdminDatabase.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiUser, FiPhone, FiDatabase, FiCpu, FiAlertCircle } from 'react-icons/fi';
import styles from './AdminDatabase.module.css';

export default function AdminDatabase() {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🌟 NEW: AI Moderation States
  const [isVerifying, setIsVerifying] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');

  // 1. Fetch real reports from MongoDB when the component loads
  const fetchReports = async () => {
    try {
      // Assuming you have a GET route to fetch all reports for the admin
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/reports`, {
        withCredentials: true
      });
      console.log('data : ',response)
      setReports(response.data);
    } catch (error) {
      console.warn("Could not fetch real reports, loading mock data for UI testing...", error);
      // Hackathon Fallback: If the backend route isn't ready, use the mock data!
      setReports([
        {
          _id: "RPT-8842",
          user_id: { name: "Rahul Sharma" }, // Mock populated user
          category: "Financial / Bank Fraud",
          scammerDetails: "UPI: fake-customs@ybl",
          description: "They called claiming my FedEx package was seized and demanded ₹4999 via UPI.",
          status: "pending",
          aiReason: "",
          createdAt: new Date().toISOString()
        },
        {
          _id: "RPT-8841",
          user_id: { name: "Spam Bot" },
          category: "Unknown",
          scammerDetails: "dhjskafhjsdkhf",
          description: "buy cheap shoes link click here please free money",
          status: "pending",
          aiReason: "",
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 🌟 2. The AI Bulk Verification Trigger
  const handleAiVerification = async () => {
    setIsVerifying(true);
    setAdminMessage('🤖 AI is reading and moderating all pending reports...');

    try {
      // Calls the Node.js route we just built!
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/verify-pending`, {}, {
        withCredentials: true 
      });

      // Show the success message (e.g., "Verified: 4, Rejected: 1")
      setAdminMessage(response.data.message); 
      
      // Re-fetch the database to show the newly updated statuses!
      fetchReports(); 

    } catch (error) {
      console.error("AI Verification failed:", error);
      setAdminMessage("🔴 Failed to connect to AI Moderator.");
    } finally {
      setIsVerifying(false);
      // Clear the message after 5 seconds
      setTimeout(() => setAdminMessage(''), 5000);
    }
  };

  // 3. Manual Admin Action (Fallback for human override)
  const handleAction = async (id, newStatus) => {
    // Optimistic UI update
    setReports(reports.map(report => 
      report._id === id ? { ...report, status: newStatus, aiReason: "Manually overridden by Admin" } : report
    ));
    
    // Optional: Add an axios.put() here later to save manual overrides to MongoDB!
  };

  // Filter reports based on search input
  const filteredReports = reports.filter(report => 
    report.scammerDetails?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    report.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Global Threat Database</h2>
          <p className={styles.subtitle}>Admin panel to review community reports and manage threat data.</p>
        </div>
        
        {/* 🌟 NEW: The AI Moderation Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <button 
            className={styles.trainBtn} 
            onClick={handleAiVerification}
            disabled={isVerifying}
            style={{ 
              background: isVerifying ? '#9ca3af' : '#4f46e5',
              cursor: isVerifying ? 'wait' : 'pointer'
            }}
          >
            <FiCpu /> {isVerifying ? 'Moderating via AI...' : 'Verify Pending with AI'}
          </button>
          {adminMessage && (
            <span style={{ marginTop: '8px', fontSize: '0.85rem', color: '#059669', fontWeight: 'bold' }}>
              {adminMessage}
            </span>
          )}
        </div>
      </div>

      {/* Admin Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <h4>Total Reports</h4>
          <p className={styles.statTotal}>{reports.length}</p>
        </div>
        <div className={styles.statCard}>
          <h4>Pending Review</h4>
          <p className={styles.statPending}>{reports.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className={styles.statCard}>
          <h4>Verified Threats</h4>
          <p className={styles.statVerified}>{reports.filter(r => r.status === 'verified').length}</p>
        </div>
      </div>

      {/* Data Table Section */}
      <div className={styles.tableCard}>
        
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by details or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.filterBtn}><FiFilter /> Filter</button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Victim Details</th>
                <th>Threat Target (Link/Phone)</th>
                <th>Category</th>
                <th>Status & AI Logic</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report._id}>
                  
                  <td data-label="Report ID">
                    <span className={styles.reportId}>...{report._id.toString().slice(-6)}</span>
                    <span className={styles.dateText}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  
                  <td data-label="Victim Details">
                    <div className={styles.userInfo}>
                      <span className={styles.userName}><FiUser /> {report.user_id?.name || 'Anonymous'}</span>
                    </div>
                  </td>
                  
                  <td data-label="Threat Target">
                    <div className={styles.threatInfo}>
                      <span className={styles.threatDetails}>{report.scammerDetails}</span>
                      <span className={styles.threatDesc}>{report.description}</span>
                    </div>
                  </td>
                  
                  <td data-label="Category">
                    <span className={`${styles.typeBadge} ${styles[report.category]}`}>
                      {report.category}
                    </span>
                  </td>
                  
                  <td data-label="Status & AI Logic">
                    <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                    {/* 🌟 Show the AI's reasoning if it was auto-moderated! */}
                    {report.aiReason && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', maxWidth: '200px' }}>
                        <FiCpu style={{ display: 'inline' }}/> {report.aiReason}
                      </div>
                    )}
                  </td>
                  
                  <td data-label="Admin Actions">
                    {report.status === 'pending' ? (
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.verifyBtn} 
                          title="Manually Verify"
                          onClick={() => handleAction(report._id, 'verified')}
                        ><FiCheckCircle /></button>
                        <button 
                          className={styles.rejectBtn} 
                          title="Manually Reject"
                          onClick={() => handleAction(report._id, 'rejected')}
                        ><FiXCircle /></button>
                      </div>
                    ) : (
                      <span className={styles.actionComplete}>Processed</span>
                    )}
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredReports.length === 0 && (
            <div className={styles.emptyState}>
              <FiDatabase className={styles.emptyIcon} />
              <p>No reports found matching your search.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}