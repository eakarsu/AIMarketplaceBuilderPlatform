import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AICenter from './pages/AICenter';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

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
        <Login onLogin={handleLogin} showToast={showToast} />
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
        {currentPage !== 'dashboard' && currentPage !== 'ai-center' && (
          <FeaturePage feature={currentPage} showToast={showToast} setCurrentPage={setCurrentPage} />
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
