import React, { useState, useEffect } from 'react';
import api from '../api';

const FEATURE_LABELS = {
  'trip-plans': 'Trip Planner',
  'content-items': 'Content Writer',
  'code-snippets': 'Code Assistant',
  'image-prompts': 'Image Prompt',
  'business-plans': 'Business Plan',
  'email-templates': 'Email Template',
  'recipes': 'Recipe',
  'resumes': 'Resume',
  'marketing-copies': 'Marketing Copy',
  'stories': 'Story',
  'translations': 'Translation',
  'seo-items': 'SEO Optimizer',
  'chat-scripts': 'Chat Script',
  'product-descriptions': 'Product Description',
  'social-posts': 'Social Post',
  'learning-paths': 'Learning Path',
};

const FEATURE_ICONS = {
  'trip-plans': '✈️',
  'content-items': '✍️',
  'code-snippets': '💻',
  'image-prompts': '🎨',
  'business-plans': '💼',
  'email-templates': '📧',
  'recipes': '🍳',
  'resumes': '📄',
  'marketing-copies': '📢',
  'stories': '📖',
  'translations': '🌐',
  'seo-items': '🔍',
  'chat-scripts': '💬',
  'product-descriptions': '🛒',
  'social-posts': '📱',
  'learning-paths': '🎓',
};

export default function PublicTemplates({ showToast, setCurrentPage }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/templates/public');
      setTemplates(data);
    } catch (err) {
      showToast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const featureTypes = ['all', ...new Set(templates.map(t => t.feature_type))];

  const filtered = filter === 'all' ? templates : templates.filter(t => t.feature_type === filter);

  const handleUseTemplate = (template) => {
    if (setCurrentPage) {
      setCurrentPage(template.feature_type);
      showToast(`Navigated to ${FEATURE_LABELS[template.feature_type] || template.feature_type}`, 'success');
    } else {
      showToast('Sign in to use this template', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>🌐 Public Templates Marketplace</h2>
        <p>Browse and use AI-generated templates shared by the community</p>
      </div>
      <div className="page-body">
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {featureTypes.map(ft => (
            <button
              key={ft}
              className={`btn btn-sm ${filter === ft ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(ft)}
            >
              {ft === 'all' ? 'All' : FEATURE_ICONS[ft] + ' ' + (FEATURE_LABELS[ft] || ft)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading public templates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🌐</div>
            <p>No public templates yet. Be the first to publish!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(template => (
              <div key={`${template.feature_type}-${template.id}`} style={{
                background: 'var(--card-bg, #fff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{FEATURE_ICONS[template.feature_type] || '🤖'}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{template.name}</div>
                    <span className="card-badge" style={{ fontSize: 11 }}>
                      {FEATURE_LABELS[template.feature_type] || template.feature_type}
                    </span>
                  </div>
                </div>

                {template.ai_content && (
                  <div>
                    <div style={{
                      fontSize: 13,
                      color: '#64748b',
                      maxHeight: expanded === `${template.feature_type}-${template.id}` ? 'none' : 80,
                      overflow: 'hidden',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {template.ai_content}
                    </div>
                    {template.ai_content.length > 200 && (
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ fontSize: 12, padding: '2px 8px', marginTop: 4 }}
                        onClick={() => setExpanded(
                          expanded === `${template.feature_type}-${template.id}`
                            ? null
                            : `${template.feature_type}-${template.id}`
                        )}
                      >
                        {expanded === `${template.feature_type}-${template.id}` ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {new Date(template.created_at).toLocaleDateString()}
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use as Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
