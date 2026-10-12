import NativeAIControls from "../components/NativeAIControls";
import useNativeAIRequest from "../components/useNativeAIRequest";
import React, { useState } from 'react';
import api from '../api';
import AIOutput from '../components/AIOutput';

export const TOOLS = [
  {
    key: 'marketplace-recommendations',
    label: 'Marketplace Recommendations',
    icon: '🛍️',
    endpoint: '/api/ai/marketplace-recommendations',
    desc: 'Recommend products from user interests + recent views.',
    fields: [
      { key: 'userInterests', label: 'User Interests', type: 'textarea', placeholder: 'comma-separated interests / categories', required: true },
      { key: 'recentViews', label: 'Recent Views', type: 'textarea', placeholder: 'One product title per line or a JSON array' },
      { key: 'limit', label: 'Maximum Recommendations', type: 'number', min: 1, max: 10 },
    ],
  },
  {
    key: 'seller-match',
    label: 'Seller Match',
    icon: '🤝',
    endpoint: '/api/ai/seller-match',
    desc: 'Score sellers against a customer need.',
    fields: [
      { key: 'customerNeed', label: 'Customer Need', type: 'textarea', placeholder: 'Describe what the customer needs', required: true },
      { key: 'availableSellers', label: 'Available Sellers', type: 'textarea', placeholder: 'JSON array or one seller profile per line' },
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
      { key: 'product', label: 'Product', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'currentPrice', label: 'Current Price (USD)', type: 'number', min: 0 },
      { key: 'costBasis', label: 'Cost Basis (USD)', type: 'number', min: 0 },
      { key: 'competitorPrices', label: 'Competitor Prices', type: 'textarea', placeholder: 'JSON array or comma-separated prices' },
      { key: 'demandSignals', label: 'Demand Signals', type: 'text', placeholder: 'e.g. steady demand, low stock, seasonal peak' },
    ],
  },
  {
    key: 'fraud-detection',
    label: 'Fraud Detection',
    icon: '🛡️',
    endpoint: '/api/ai/fraud-detection',
    desc: 'Text-only signal review of a listing + seller for fraud risk.',
    fields: [
      { key: 'listingTitle', label: 'Listing Title', type: 'text', required: true },
      { key: 'listingDescription', label: 'Listing Description', type: 'textarea', placeholder: 'Full listing description' },
      { key: 'sellerProfile', label: 'Seller Profile', type: 'textarea', placeholder: 'Seller name, history, ratings, verification status' },
      { key: 'signals', label: 'Additional Signals', type: 'textarea', placeholder: 'One signal per line or a JSON array' },
    ],
  },
];

export const TOOL_PRESETS = {
  'marketplace-recommendations': [
    { userInterests: 'durable travel gear, sustainable materials, compact organization', recentViews: 'TrailLight Modular Backpack\nPacking Cube Set\nWeatherproof Daypack', limit: 5 },
    { userInterests: 'ergonomic home office, task lighting, cable management', recentViews: '["QuietDesk Focus Lamp", "Adjustable Laptop Stand", "Wool Desk Mat"]', limit: 4 },
    { userInterests: 'home cooking, pantry organization, reusable storage', recentViews: 'FreshKeep Pantry Set\nGlass Spice Jars\nReusable Produce Bags', limit: 6 },
  ],
  'seller-match': [
    { customerNeed: 'Supply 120 repairable travel backpacks within six weeks, with recycled materials and replacement-part support.', availableSellers: '[{"name":"Northstar Gear","specialty":"repairable bags","rating":4.8},{"name":"FieldWorks Co.","specialty":"recycled textiles","rating":4.6}]', preferences: 'Verified materials, domestic shipping, and a written warranty' },
    { customerNeed: 'Find a supplier for 60 glare-free desk lamps for distributed employees with delivery to three offices.', availableSellers: '[{"name":"Lumen Studio","specialty":"office lighting","rating":4.7},{"name":"WorkKind","specialty":"ergonomic equipment","rating":4.5}]', preferences: 'Fast shipping, energy efficiency, and replacement parts' },
    { customerNeed: 'Source modular pantry containers for a seasonal retail launch with consistent packaging and replenishment.', availableSellers: '[{"name":"FreshForm","specialty":"food storage","rating":4.9},{"name":"PantryLab","specialty":"modular kitchen goods","rating":4.4}]', preferences: 'Food-safe certification, volume pricing, and reliable restocking' },
  ],
  'pricing-advisor': [
    { product: 'TrailLight Modular Backpack', category: 'Travel accessories', currentPrice: 129, costBasis: 54, competitorPrices: '119, 139, 149', demandSignals: 'Steady demand, 18% repeat purchase rate, and limited inventory before summer travel' },
    { product: 'QuietDesk Focus Lamp', category: 'Home office lighting', currentPrice: 79, costBasis: 31, competitorPrices: '[69, 84, 99]', demandSignals: 'Growing corporate orders, stable returns, and moderate price sensitivity' },
    { product: 'FreshKeep Pantry Set', category: 'Kitchen organization', currentPrice: 249, costBasis: 112, competitorPrices: '229\n259\n279', demandSignals: 'Seasonal lift, strong bundle conversion, and sufficient stock for eight weeks' },
  ],
  'fraud-detection': [
    { listingTitle: 'TrailLight Modular Backpack — New', listingDescription: 'Unused 28-liter recycled-fabric backpack with modular organizer, original tags, receipt, and manufacturer warranty.', sellerProfile: 'Seller since 2021; identity verified; 4.8 rating across 186 sales; normal refund rate.', signals: 'New shipping address\nReceipt image supplied\nPrice is 12% below typical retail' },
    { listingTitle: 'QuietDesk Focus Lamp — Open Box', listingDescription: 'Open-box lamp with all accessories, serial label, minor packaging wear, and a 30-day seller return window.', sellerProfile: 'Seller since 2023; payment verified; 4.6 rating across 42 sales; three recent address changes.', signals: '["Requests payment through marketplace checkout", "Serial number photo supplied", "Two failed login attempts this week"]' },
    { listingTitle: 'FreshKeep Pantry Set — Bulk Lot', listingDescription: 'Case of twelve sealed pantry sets from a store closeout. Includes lot numbers and purchase invoice.', sellerProfile: 'Business seller; tax profile verified; 4.9 rating across 530 sales; established kitchen-goods catalog.', signals: 'Large order value\nInvoice supplied\nBuyer requested expedited international forwarding' },
  ],
};

export function parseList(value) {
  if (Array.isArray(value)) return value;
  const text = String(value || '').trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) { /* Accept line- and comma-separated input below. */ }
  return text.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}

export function buildToolPayload(tool, inputs) {
  if (tool.key === 'marketplace-recommendations') return {
    userInterests: inputs.userInterests,
    recentViews: parseList(inputs.recentViews),
    ...(inputs.limit !== '' && inputs.limit !== undefined ? { limit: Number(inputs.limit) } : {}),
  };
  if (tool.key === 'seller-match') return {
    customerNeed: inputs.preferences ? `${inputs.customerNeed}\nPreferences: ${inputs.preferences}` : inputs.customerNeed,
    availableSellers: parseList(inputs.availableSellers),
  };
  if (tool.key === 'pricing-advisor') return {
    product: inputs.category ? `${inputs.product} (${inputs.category})` : inputs.product,
    ...(inputs.currentPrice !== '' && inputs.currentPrice !== undefined ? { currentPrice: Number(inputs.currentPrice) } : {}),
    ...(inputs.costBasis !== '' && inputs.costBasis !== undefined ? { costBasis: Number(inputs.costBasis) } : {}),
    competitorPrices: parseList(inputs.competitorPrices).map((value) => Number(value)).filter(Number.isFinite),
    demandSignals: inputs.demandSignals,
  };
  return {
    listingTitle: inputs.listingTitle,
    listingDescription: inputs.listingDescription,
    sellerProfile: inputs.sellerProfile,
    signals: parseList(inputs.signals),
  };
}

export default function AIToolsPage({ showToast }) {
  const nativeAIRequest = useNativeAIRequest();

  const [active, setActive] = useState(TOOLS[0].key);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const tool = TOOLS.find(t => t.key === active);
  const requiredComplete = tool.fields.filter(field => field.required).every(field => String(inputs[field.key] || '').trim());
  const presets = TOOL_PRESETS[tool.key].map((values, index) => ({
    name: ['Launch review', 'Operations review', 'Growth review'][index],
    fill: () => {
      setInputs(values);
      setResult(null);
      setError(null);
      return { filled: tool.fields.length, manual: [] };
    },
  }));

  const handleChange = (key, value) =>
    setInputs(prev => ({ ...prev, [key]: value }));

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const payload = buildToolPayload(tool, inputs);
      const { data } = await nativeAIRequest.run((signal) => api.post(tool.endpoint, payload, { signal }));
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
    <NativeAIControls busy={nativeAIRequest.busy} onCancel={nativeAIRequest.cancel} context="Marketplace Builder Platform" presets={presets}><>
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
              <AIOutput content={result} title={`${tool.label} result`} />
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
                  {field.label}{field.required ? ' *' : ' (optional)'}
                </label>
                {field.type === 'textarea' ? (
                  <textarea data-ai-field={field.key}
                    rows={3}
                    required={field.required}
                    value={inputs[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
                    style={{ width: '100%', padding: 8, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 6 }}
                  />
                ) : (
                  <input data-ai-field={field.key}
                    type={field.type || 'text'}
                    min={field.min}
                    max={field.max}
                    required={field.required}
                    value={inputs[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
                    style={{ width: '100%', padding: 8, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 6 }}
                  />
                )}
              </div>
            ))}
            <button className="btn btn-ai" onClick={handleRun} disabled={loading || !requiredComplete}>
              {loading ? <span className="spinner"></span> : `✨ Run ${tool.label}`}
            </button>
          </div>
        </div>
      </div>
    </></NativeAIControls>
  );
}
