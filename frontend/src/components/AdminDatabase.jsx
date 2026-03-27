// src/components/AdminDatabase.jsx
import React, { useState } from 'react';
import { FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiUser, FiPhone, FiDatabase, FiCpu } from 'react-icons/fi';
import styles from './AdminDatabase.module.css';

export default function AdminDatabase() {
  // Mock data representing submissions from the Recovery Hub
  const [reports, setReports] = useState([
    {
      id: "RPT-8842",
      user: "Rahul Sharma",
      mobile: "+91 98765 43210",
      type: "financial",
      details: "UPI: fake-customs@ybl",
      desc: "They called claiming my FedEx package was seized and demanded ₹4999 via UPI.",
      date: "Today, 10:45 AM",
      status: "pending"
    },
    {
      id: "RPT-8841",
      user: "Priya Desai",
      mobile: "+91 87654 32109",
      type: "phishing",
      details: "http://hdfc-kyc-update.net.in",
      desc: "Received SMS saying my bank account would be blocked if I didn't update PAN.",
      date: "Today, 09:15 AM",
      status: "verified"
    },
    {
      id: "RPT-8840",
      user: "Amit Kumar",
      mobile: "+91 76543 21098",
      type: "job",
      details: "wa.me/918888888888",
      desc: "WhatsApp message offering ₹5000/day for liking YouTube videos.",
      date: "Yesterday, 04:30 PM",
      status: "verified"
    },
    {
      id: "RPT-8839",
      user: "Neha Singh",
      mobile: "+91 65432 10987",
      type: "impersonation",
      details: "+91 99999 00000",
      desc: "Caller pretended to be CBI officer stating my Aadhaar was linked to crime.",
      date: "Yesterday, 02:10 PM",
      status: "rejected"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // Handle Admin Action (Verify or Reject a report)
  const handleAction = (id, newStatus) => {
    setReports(reports.map(report => 
      report.id === id ? { ...report, status: newStatus } : report
    ));
  };

  // Filter reports based on search input
  const filteredReports = reports.filter(report => 
    report.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
    report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.mobile.includes(searchTerm)
  );

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Global Threat Database</h2>
          <p className={styles.subtitle}>Admin panel to review community reports and train the AI model.</p>
        </div>
        <button className={styles.trainBtn}>
          <FiCpu /> Train AI with Verified Data
        </button>
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
              placeholder="Search by phone, link, or type..." 
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
                <th>Status</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  
                  {/* ADDED data-label attributes to each td */}
                  <td data-label="Report ID">
                    <span className={styles.reportId}>{report.id}</span>
                    <span className={styles.dateText}>{report.date}</span>
                  </td>
                  
                  <td data-label="Victim Details">
                    <div className={styles.userInfo}>
                      <span className={styles.userName}><FiUser /> {report.user}</span>
                      <span className={styles.userMobile}><FiPhone /> {report.mobile}</span>
                    </div>
                  </td>
                  
                  <td data-label="Threat Target">
                    <div className={styles.threatInfo}>
                      <span className={styles.threatDetails}>{report.details}</span>
                      <span className={styles.threatDesc}>{report.desc}</span>
                    </div>
                  </td>
                  
                  <td data-label="Category">
                    <span className={`${styles.typeBadge} ${styles[report.type]}`}>
                      {report.type.toUpperCase()}
                    </span>
                  </td>
                  
                  <td data-label="Status">
                    <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </td>
                  
                  <td data-label="Admin Actions">
                    {report.status === 'pending' ? (
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.verifyBtn} 
                          title="Verify & Add to DB"
                          onClick={() => handleAction(report.id, 'verified')}
                        ><FiCheckCircle /></button>
                        <button 
                          className={styles.rejectBtn} 
                          title="Reject (False Flag)"
                          onClick={() => handleAction(report.id, 'rejected')}
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