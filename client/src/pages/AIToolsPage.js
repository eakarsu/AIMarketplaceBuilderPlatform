import React, { useState } from 'react';
import api from '../api';
import AIOutput from '../components/AIOutput';

const TOOLS = [
  {
    key: 'marketplace-recommendations',
    label: 'Marketplace Recommendations',
    icon: '🛍️',
    endpoint: '/api/ai/marketplace-recommendations',
    desc: 'Recommend products from user interests + recent views.',
    fields: [
      { key: 'userInterests', label: 'User Interests', type: 'textarea', placeholder: 'comma-separated interests / categories' },
      { key: 'recentViews', label: 'Recent Views', type: 'textarea', placeholder: 'Product titles or IDs viewed recently' },
      { key: 'budget', label: 'Budget (USD)', type: 'number' },
    ],
  },
  {
    key: 'seller-match',
    label: 'Seller Match',
    icon: '🤝',
    endpoint: '/api/ai/seller-match',
    desc: 'Score sellers against a customer need.',
    fields: [
      { key: 'customerNeed', label: 'Customer Need', type: 'textarea', placeholder: 'Describe what the customer needs' },
      { key: 'sellers', label: 'Sellers (JSON or list)', type: 'textarea', placeholder: 'Seller names, specialties, ratings' },
      { key: 'preferences', label: 'Preferences', type: 'text', placeholder: 'e.g. fast shipping, premium quality' },
    ],
  },
  {
    key: 'pricing-advisor',
    label: 'Pricing Advisor',
    icon: '💲',
    endpoint: '/api/ai/pricing-advisor',
    desc: 'Suggest pricing strategy with band, tactics, and margin impact.',
    fields: [
      { key: 'productName', label: 'Product Name', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'currentPrice', label: 'Current Price (USD)', type: 'number' },
      { key: 'cost', label: 'Cost (USD)', type: 'number' },
      { key: 'competitors', label: 'Competitor Prices', type: 'textarea', placeholder: 'List competitor prices / positioning' },
      { key: 'goal', label: 'Goal', type: 'text', placeholder: 'e.g. maximize revenue, gain share' },
    ],
  },
  {
    key: 'fraud-detection',
    label: 'Fraud Detection',
    icon: '🛡️',
    endpoint: '/api/ai/fraud-detection',
    desc: 'Text-only signal review of a listing + seller for fraud risk.',
    fields: [
      { key: 'listingTitle', label: 'Listing Title', type: 'text' },
      { key: 'listingDescription', label: 'Listing Description', type: 'textarea', placeholder: 'Full listing description' },
      { key: 'sellerProfile', label: 'Seller Profile', type: 'textarea', placeholder: 'Seller name, history, ratings, verification status' },
      { key: 'signals', label: 'Additional Signals', type: 'textarea', placeholder: 'IP changes, off-platform contact attempts, payment redirection, etc.' },
    ],
  },
];

export default function AIToolsPage({ showToast }) {
  const [active, setActive] = useState(TOOLS[0].key);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const tool = TOOLS.find(t => t.key === active);

  const handleChange = (key, value) =>
    setInputs(prev => ({ ...prev, [key]: value }));

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const payload = {};
      tool.fields.forEach(f => {
        const v = inputs[f.key];
        if (v === undefined || v === '') return;
        payload[f.key] = f.type === 'number' ? Number(v) : v;
      });
      const { data } = await api.post(tool.endpoint, payload);
      setResult(data);
      if (showToast) showToast('AI response generated!');
    } catch (err) {
      const msg = err.response?.status === 503
        ? (err.response?.data?.error || 'AI service unavailable: API key not configured.')
        : (err.response?.data?.error || err.message || 'Request failed');
      setError(msg);
      if (showToast) showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>🧠 AI Marketplace Tools</h2>
        <p>Specialized AI flows for marketplace operations.</p>
      </div>
      <div className="page-body">
        <div className="ai-center-grid">
          {TOOLS.map(t => (
            <button
              key={t.key}
              className="ai-feature-btn"
              onClick={() => { setActive(t.key); setInputs({}); setResult(null); setError(null); }}
              style={active === t.key ? { borderColor: '#c084fc', background: 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(129,140,248,0.15))' } : {}}
            >
              <div className="icon">{t.icon}</div>
              <div>
                <div className="label">{t.label}</div>
                <div className="desc">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="ai-chat-area" style={{ marginTop: 16 }}>
          <div className="ai-chat-header">
            <span className="icon">{tool.icon}</span>
            <div>
              <strong>{tool.label}</strong>
              <span style={{ color: '#64748b', fontSize: 13, marginLeft: 8 }}>{tool.desc}</span>
            </div>
          </div>

          <div className="ai-chat-body">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>AI is thinking...</p>
              </div>
            ) : error ? (
              <div className="empty-state" style={{ color: '#fecaca' }}>
                <div className="icon">⚠️</div>
                <p>{error}</p>
              </div>
            ) : result ? (
              typeof result === 'string' ? (
                <AIOutput content={result} />
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontSize: 13, color: '#e2e8f0' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              )
            ) : (
              <div className="empty-state">
                <div className="icon">💡</div>
                <p>Fill the form below and click Run to generate AI insights.</p>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 12, padding: 16, borderTop: '1px solid #334155' }}>
            {tool.fields.map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cbd5e1' }}>
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={inputs[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
                    style={{ width: '100%', padding: 8, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 6 }}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={inputs[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
                    style={{ width: '100%', padding: 8, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 6 }}
                  />
                )}
              </div>
            ))}
            <button className="btn btn-ai" onClick={handleRun} disabled={loading}>
              {loading ? <span className="spinner"></span> : `✨ Run ${tool.label}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
