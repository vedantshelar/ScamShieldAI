// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';

import Overview from './components/Overview';
import TextScanner from './components/TextScanner';
import MediaAnalyzer from './components/MediaAnalyzer';
import AiAssistant from './components/AiAssistant';
import RecoveryHub from './components/RecoveryHub';
import SmsSimulator from './components/SmsSimulator';
import ScamQuiz from './components/ScamQuiz';
import AdminDatabase from './components/AdminDatabase';
import AuthPage from './pages/AuthPage';
import PhishingSimulator from './components/PhishingSimulator';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* All tools are nested inside the Dashboard */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="overview" replace />} />
          
          <Route path="overview" element={<Overview />} />
          <Route path="scanner" element={<TextScanner />} />
          <Route path="media" element={<MediaAnalyzer />} />
          <Route path="assistant" element={<AiAssistant />} />
          <Route path="recovery" element={<RecoveryHub />} />
          <Route path="simulator" element={<SmsSimulator />} />
          <Route path="quiz" element={<ScamQuiz />} />
          <Route path="phish-simulator" element={<PhishingSimulator />} />
          
          {/* We will protect this route directly inside Dashboard.jsx! */}
          <Route path="admin" element={<AdminDatabase />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;