// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';

// Import your new 5 components
import Overview from './components/Overview';
import TextScanner from './components/TextScanner';
import MediaAnalyzer from './components/MediaAnalyzer';
import AiAssistant from './components/AiAssistant';
import RecoveryHub from './components/RecoveryHub';
import SmsSimulator from './components/SmsSimulator';
import ScamQuiz from './components/ScamQuiz';
import AdminDatabase from './components/AdminDatabase';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        
        <Route path="/dashboard" element={<Dashboard />}>
          {/* Default to overview when visiting /dashboard */}
          <Route index element={<Navigate to="overview" replace />} /> 
          
          <Route path="overview" element={<Overview />} />
          <Route path="scanner" element={<TextScanner />} />
          <Route path="media" element={<MediaAnalyzer />} />
          <Route path="assistant" element={<AiAssistant />} />
          <Route path="recovery" element={<RecoveryHub />} />
          <Route path="simulator" element={<SmsSimulator />} />
          <Route path="quiz" element={<ScamQuiz />} />
          <Route path="admin" element={<AdminDatabase />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;