import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicTemplates from './pages/PublicTemplates';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AICenter from './pages/AICenter';
import AIToolsPage from './pages/AIToolsPage';
import EscrowDisputeScore from './pages/EscrowDisputeScore';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return (
      <>
        <Router>
          <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

            <Route path="/register" element={<Register onLogin={handleLogin} showToast={showToast} />} />
            <Route path="/templates" element={<PublicTemplates showToast={showToast} />} />
            <Route path="*" element={<Login onLogin={handleLogin} showToast={showToast} />} />
          </Routes>
        </Router>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </>
    );
  }

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
      <div className="main-content">
        {currentPage === 'dashboard' && <Dashboard setCurrentPage={setCurrentPage} />}
        {currentPage === 'ai-center' && <AICenter showToast={showToast} />}
        {currentPage === 'ai-tools' && <AIToolsPage showToast={showToast} />}
        {currentPage === 'escrow-dispute-score' && <EscrowDisputeScore showToast={showToast} />}
        {currentPage === 'public-templates' && <PublicTemplates showToast={showToast} setCurrentPage={setCurrentPage} />}
        {currentPage !== 'dashboard' && currentPage !== 'ai-center' && currentPage !== 'ai-tools' && currentPage !== 'escrow-dispute-score' && currentPage !== 'public-templates' && (
          <FeaturePage feature={currentPage} showToast={showToast} setCurrentPage={setCurrentPage} />
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
