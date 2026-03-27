// src/components/MediaAnalyzer.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FiUploadCloud, FiImage, FiMic, FiFileText, FiAlertOctagon, FiCheckCircle, FiTrash2, FiMaximize } from 'react-icons/fi';
import styles from './MediaAnalyzer.module.css';

export default function MediaAnalyzer() {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'audio'
  const [processState, setProcessState] = useState('idle'); // 'idle', 'extracting', 'analyzing', 'complete', 'error'
  
  // Real data states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const fileInputRef = useRef(null);

  // Trigger the hidden file input for BOTH tabs now!
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // 🔥 THE REAL BACKEND FILE UPLOAD (IMAGE & AUDIO) 🔥
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Setup initial UI states
    setSelectedFile(file);
    setProcessState('extracting'); 
    
    // Only create an image preview URL if it's actually an image
    if (activeTab === 'image') {
      setPreviewUrl(URL.createObjectURL(file));
    }

    // 2. Prepare the FormData
    const formData = new FormData();
    
    try {
      let response;

      // 3. Route to the correct Node.js endpoint based on the active tab
      if (activeTab === 'image') {
        formData.append('scamImage', file); // Matches upload.single('scamImage')
        response = await axios.post('http://localhost:4000/api/scan-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (activeTab === 'audio') {
        formData.append('scamAudio', file); // Matches upload.single('scamAudio')
        response = await axios.post('http://localhost:4000/api/scan-audio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      console.log("AI Result Data: ", response.data);

      // 4. Update UI with the final Groq/Python data
      setAnalysisResult(response.data);
      setProcessState('complete');

    } catch (error) {
      console.error("Media processing failed:", error);
      setProcessState('error');
    }
  };

  const resetAnalyzer = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setProcessState('idle');
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <h2 className={styles.title}>Multi-Modal Media Analyzer</h2>
        <p className={styles.subtitle}>Upload screenshots or audio recordings to extract text and detect scams.</p>
      </div>

      {/* Dynamic File Input - Changes accepted file types based on the active tab! */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept={activeTab === 'image' ? "image/png, image/jpeg, image/jpg" : "audio/mp3, audio/wav, audio/mpeg, audio/m4a"} 
        style={{ display: 'none' }} 
      />

      {/* Tabs */}
      <div className={styles.tabContainer}>
        <button 
          className={activeTab === 'image' ? styles.activeTab : styles.tab}
          onClick={() => { setActiveTab('image'); resetAnalyzer(); }}
        >
          <FiImage className={styles.tabIcon} /> Image / Screenshot (Real API)
        </button>
        <button 
          className={activeTab === 'audio' ? styles.activeTab : styles.tab}
          onClick={() => { setActiveTab('audio'); resetAnalyzer(); }}
        >
          <FiMic className={styles.tabIcon} /> Audio / VoIP Call (Real API)
        </button>
      </div>

      {/* State 1: Upload Zone */}
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

      {/* States: Processing and Results */}
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

            {/* Media Preview Area */}
            <div className={styles.previewBox}>
              {activeTab === 'image' && previewUrl ? (
                <div className={styles.imageContainer}>
                  <img src={previewUrl} alt="Uploaded Scam" className={styles.uploadedImage} />
                  {processState === 'extracting' && <div className={styles.scannerLine}></div>}
                </div>
              ) : (
                <div className={styles.audioWaveform}>
                  {/* Fake Audio Waves that animate while extracting */}
                  <div className={`${styles.waveBar} ${processState !== 'complete' ? styles.animateWave : ''}`}></div>
                  <div className={`${styles.waveBar} ${processState !== 'complete' ? styles.animateWave : ''}`} style={{ animationDelay: '0.2s' }}></div>
                  <div className={`${styles.waveBar} ${processState !== 'complete' ? styles.animateWave : ''}`} style={{ animationDelay: '0.4s' }}></div>
                  <div className={`${styles.waveBar} ${processState !== 'complete' ? styles.animateWave : ''}`} style={{ animationDelay: '0.1s' }}></div>
                </div>
              )}
            </div>

            {/* Extracted Text Box */}
            <div className={styles.extractedTextContainer}>
              <div className={styles.textHeader}>
                <FiFileText /> 
                <span>{activeTab === 'image' ? 'OCR Extracted Text' : 'Speech-to-Text Transcript'}</span>
              </div>
              <div className={styles.textBody}>
                {processState === 'extracting' ? (
                  <span className={styles.loadingText}>
                    {activeTab === 'image' ? 'Running OCR Engine...' : 'Transcribing Audio via AI...'}
                  </span>
                ) : processState === 'error' ? (
                  <span className={styles.errorText}>Failed to extract text.</span>
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
              {processState === 'extracting' && (
                <div className={styles.waitingState}>
                  <div className={styles.spinner}></div>
                  <p>Extracting data from media...</p>
                </div>
              )}

              {processState === 'analyzing' && (
                <div className={styles.waitingState}>
                  <div className={styles.radarIcon}><FiMaximize /></div>
                  <p className={styles.pulseText}>Analyzing contextual patterns...</p>
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

                  {analysisResult.manipulation && analysisResult.manipulation.length > 0 && (
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
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