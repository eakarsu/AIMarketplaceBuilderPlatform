import React from 'react';
import { featureList } from '../featureConfig';

export default function Sidebar({ currentPage, setCurrentPage, onLogout }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>AI Marketplace</h1>
        <p>Builder Platform</p>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Main</div>
        <button
          className={`sidebar-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentPage('dashboard')}
        >
          <span>🏠</span>
          <span>Dashboard</span>
        </button>
        <button
          className={`sidebar-item ${currentPage === 'ai-center' ? 'active' : ''}`}
          onClick={() => setCurrentPage('ai-center')}
        >
          <span>🤖</span>
          <span>AI Center</span>
        </button>
        <button
          className={`sidebar-item ${currentPage === 'ai-tools' ? 'active' : ''}`}
          onClick={() => setCurrentPage('ai-tools')}
        >
          <span>🧠</span>
          <span>AI Tools</span>
        </button>
        <button
          className={`sidebar-item ${currentPage === 'public-templates' ? 'active' : ''}`}
          onClick={() => setCurrentPage('public-templates')}
        >
          <span>🌐</span>
          <span>Marketplace</span>
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">AI Features</div>
        {featureList.map((feature) => (
          <button
            key={feature.key}
            className={`sidebar-item ${currentPage === feature.key ? 'active' : ''}`}
            onClick={() => setCurrentPage(feature.key)}
          >
            <span>{feature.icon}</span>
            <span>{feature.title}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-section" style={{ marginTop: 'auto', paddingBottom: 20 }}>
        <button className="sidebar-item" onClick={onLogout} style={{ color: '#f87171' }}>
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
