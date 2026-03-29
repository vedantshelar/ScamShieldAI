// src/components/MediaAnalyzer.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FiUploadCloud, FiImage, FiMic, FiFileText, FiAlertOctagon, FiCheckCircle, FiTrash2, FiMaximize, FiGlobe, FiShield } from 'react-icons/fi';
import styles from './MediaAnalyzer.module.css';

export default function MediaAnalyzer() {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'audio'
  const [processState, setProcessState] = useState('idle'); // 'idle', 'processing', 'complete', 'error'
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // 🔥 THE REAL BACKEND FILE UPLOAD 🔥
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setProcessState('processing'); // Triggers the loading UI
    setAnalysisResult(null);
    
    // Create an image preview URL if it's an image
    if (activeTab === 'image') {
      setPreviewUrl(URL.createObjectURL(file));
    }

    // Prepare the multipart/form-data payload
    const formData = new FormData();
    
    try {
      let response;

      // Route to the correct Node.js endpoint based on the active tab
      if (activeTab === 'image') {
        formData.append('scamImage', file); 
        response = await axios.post('http://localhost:4000/api/scan-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
      } else if (activeTab === 'audio') {
        formData.append('scamAudio', file); 
        response = await axios.post('http://localhost:4000/api/scan-audio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
      }

      console.log("AI Result Data: ", response.data);
      setAnalysisResult(response.data);
      setProcessState('complete');

    } catch (error) {
      console.error("Media processing failed:", error);
      setProcessState('error');
    }
  };

  const resetAnalyzer = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl); // Prevent memory leaks
    setPreviewUrl(null);
    setAnalysisResult(null);
    setProcessState('idle');
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <h2 className={styles.title}>Multi-Modal Media Analyzer</h2>
        <p className={styles.subtitle}>Upload screenshots or audio recordings to extract text and detect scams.</p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept={activeTab === 'image' ? "image/png, image/jpeg, image/jpg" : "audio/mp3, audio/wav, audio/mpeg, audio/m4a, audio/webm"} 
        style={{ display: 'none' }} 
      />

      <div className={styles.tabContainer}>
        <button 
          className={activeTab === 'image' ? styles.activeTab : styles.tab}
          onClick={() => { setActiveTab('image'); resetAnalyzer(); }}
        >
          <FiImage className={styles.tabIcon} /> Image / Screenshot
        </button>
        <button 
          className={activeTab === 'audio' ? styles.activeTab : styles.tab}
          onClick={() => { setActiveTab('audio'); resetAnalyzer(); }}
        >
          <FiMic className={styles.tabIcon} /> Audio / VoIP Call
        </button>
      </div>

      {processState === 'idle' && (
        <div className={styles.uploadZone}>
          <div className={styles.uploadIconCircle}>
            <FiUploadCloud />
          </div>
          <h3>Drag & Drop your {activeTab === 'image' ? 'Screenshot' : 'Audio File'} here</h3>
          <p>Supports {activeTab === 'image' ? 'PNG, JPG' : 'MP3, WAV, M4A'} up to 10MB</p>
          <div className={styles.orDivider}><span>OR</span></div>
          
          <button className={styles.browseButton} onClick={handleUploadClick}>
            Browse Files
          </button>
        </div>
      )}

      {processState !== 'idle' && selectedFile && (
        <div className={styles.analysisGrid}>
          
          {/* Left Column: Media Preview & Extracted Data */}
          <div className={styles.mediaColumn}>
            <div className={styles.cardHeader}>
              <h4 className={styles.cardTitle}>
                {activeTab === 'image' ? <FiImage /> : <FiMic />} {selectedFile.name}
              </h4>
              <button className={styles.iconButton} onClick={resetAnalyzer}><FiTrash2 /></button>
            </div>

            <div className={styles.previewBox}>
              {activeTab === 'image' && previewUrl ? (
                <div className={styles.imageContainer}>
                  <img src={previewUrl} alt="Uploaded Scam" className={styles.uploadedImage} />
                  {processState === 'processing' && <div className={styles.scannerLine}></div>}
                </div>
              ) : (
                <div className={styles.audioWaveform}>
                  <div className={`${styles.waveBar} ${processState === 'processing' ? styles.animateWave : ''}`}></div>
                  <div className={`${styles.waveBar} ${processState === 'processing' ? styles.animateWave : ''}`} style={{ animationDelay: '0.2s' }}></div>
                  <div className={`${styles.waveBar} ${processState === 'processing' ? styles.animateWave : ''}`} style={{ animationDelay: '0.4s' }}></div>
                  <div className={`${styles.waveBar} ${processState === 'processing' ? styles.animateWave : ''}`} style={{ animationDelay: '0.1s' }}></div>
                </div>
              )}
            </div>

            <div className={styles.extractedTextContainer}>
              <div className={styles.textHeader}>
                <FiFileText /> 
                <span>{activeTab === 'image' ? 'OCR Extracted Text' : 'Speech-to-Text Transcript'}</span>
              </div>
              <div className={styles.textBody}>
                {processState === 'processing' ? (
                  <span className={styles.loadingText}>
                    {activeTab === 'image' ? 'Running Tesseract OCR Engine...' : 'Transcribing Audio via Whisper AI...'}
                  </span>
                ) : processState === 'error' ? (
                  <span className={styles.errorText}>Failed to extract data. Ensure servers are running.</span>
                ) : (
                  <p>{analysisResult?.extracted_text || "No text detected."}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis Engine */}
          <div className={styles.aiColumn}>
            <div className={styles.cardHeader}>
              <h4 className={styles.cardTitle}>AI Threat Engine</h4>
            </div>

            <div className={styles.aiEngineBody}>
              
              {processState === 'processing' && (
                <div className={styles.waitingState}>
                  <div className={styles.spinner}></div>
                  <p>Deconstructing media & querying AI models...</p>
                </div>
              )}

              {processState === 'complete' && analysisResult && (
                <div className={`${styles.finalResult} ${styles.fadeIn}`}>
                  
                  <div className={styles.scoreCircle}>
                    <span className={styles.scoreText}>{analysisResult.score}%</span>
                    <span className={styles.scoreLabel}>Threat Level</span>
                  </div>
                  
                  <div className={styles.verdictBox}>
                    {analysisResult.status === 'safe' ? (
                      <FiCheckCircle style={{ color: '#10b981', fontSize: '1.5rem', marginRight: '0.5rem' }} />
                    ) : (
                      <FiAlertOctagon className={styles.dangerIcon} />
                    )}
                    <h3>{analysisResult.type}</h3>
                  </div>

                  {/* 🌟 NEW: Dynamic Badges for Audio Language and ML Expert */}
                  <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {activeTab === 'audio' && analysisResult.detected_language && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FiGlobe /> Language: <strong>{analysisResult.detected_language}</strong>
                      </span>
                    )}
                    {activeTab === 'image' && analysisResult.expert_used && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FiShield /> Scored by: <strong>{analysisResult.expert_used === 'Not sure' ? 'General Threat' : analysisResult.expert_used} Expert Model</strong>
                      </span>
                    )}
                  </div>

                  {analysisResult.manipulation && analysisResult.manipulation.length > 0 && (
                    <div style={{ margin: '1rem 0', fontSize: '0.9rem' }}>
                      <strong style={{ color: '#57534e' }}>Tactics Detected: </strong>
                      <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                        {analysisResult.manipulation.join(' • ')}
                      </span>
                    </div>
                  )}

                  <div className={styles.actionWarning}>
                    <strong>AI Analysis: </strong> {analysisResult.explanation}
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}