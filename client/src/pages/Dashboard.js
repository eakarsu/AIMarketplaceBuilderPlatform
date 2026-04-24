import React from 'react';
import { featureList } from '../featureConfig';

export default function Dashboard({ setCurrentPage }) {
  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome to the AI Marketplace Builder Platform — Your AI-powered business toolkit</p>
      </div>
      <div className="page-body">
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-value">16</div>
            <div className="stat-label">AI Features Available</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">240+</div>
            <div className="stat-label">Items in Database</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">AI</div>
            <div className="stat-label">Powered by Claude Haiku</div>
          </div>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#f1f5f9' }}>
          AI Features
        </h3>
        <div className="cards-grid">
          {featureList.map((feature) => (
            <div
              key={feature.key}
              className="feature-card"
              onClick={() => setCurrentPage(feature.key)}
            >
              <div className="card-icon" style={{ background: 'rgba(129,140,248,0.1)' }}>
                {feature.icon}
              </div>
              <div className="card-title">{feature.title}</div>
              <div className="card-description">{feature.description}</div>
              <div className="card-meta">
                <span className="card-badge">AI Powered</span>
                <span className="card-badge purple">CRUD</span>
                <span className="card-badge green">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
