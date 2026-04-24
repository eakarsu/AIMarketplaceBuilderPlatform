import React, { useState } from 'react';
import api from '../api';
import AIOutput from '../components/AIOutput';

const aiFeatures = [
  { key: 'trip-planner', icon: '✈️', label: 'Trip Planner', desc: 'Plan trips with AI' },
  { key: 'content-writer', icon: '📝', label: 'Content Writer', desc: 'Generate any content' },
  { key: 'code-assistant', icon: '💻', label: 'Code Assistant', desc: 'Write & explain code' },
  { key: 'image-prompt', icon: '🎨', label: 'Image Prompts', desc: 'AI image prompts' },
  { key: 'business-advisor', icon: '📊', label: 'Business Advisor', desc: 'Business strategy' },
  { key: 'email-writer', icon: '📧', label: 'Email Writer', desc: 'Compose emails' },
  { key: 'recipe-chef', icon: '🍳', label: 'Recipe Chef', desc: 'Create recipes' },
  { key: 'resume-builder', icon: '📄', label: 'Resume Builder', desc: 'Build resumes' },
  { key: 'marketing-guru', icon: '📢', label: 'Marketing Guru', desc: 'Marketing copy' },
  { key: 'story-writer', icon: '📚', label: 'Story Writer', desc: 'Creative writing' },
  { key: 'translator', icon: '🌍', label: 'Translator', desc: 'Translate text' },
  { key: 'seo-expert', icon: '🔍', label: 'SEO Expert', desc: 'SEO optimization' },
  { key: 'chat-support', icon: '💬', label: 'Chat Scripts', desc: 'Support scripts' },
  { key: 'product-writer', icon: '🏷️', label: 'Product Writer', desc: 'Product descriptions' },
  { key: 'social-media', icon: '📱', label: 'Social Media', desc: 'Social posts' },
  { key: 'learning-coach', icon: '🎓', label: 'Learning Coach', desc: 'Learning paths' },
  { key: 'general', icon: '🤖', label: 'General AI', desc: 'Ask anything' },
];

export default function AICenter({ showToast }) {
  const [selectedFeature, setSelectedFeature] = useState('general');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const { data } = await api.post('/api/ai-center/generate', {
        feature: selectedFeature,
        prompt: prompt.trim(),
      });
      setResult(data.result);
      setHistory(prev => [
        { feature: selectedFeature, prompt: prompt.trim(), result: data.result, time: new Date() },
        ...prev.slice(0, 9),
      ]);
      showToast('AI response generated!');
    } catch (err) {
      showToast(err.response?.data?.error || 'AI generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const currentFeature = aiFeatures.find(f => f.key === selectedFeature);

  return (
    <>
      <div className="page-header">
        <h2>🤖 AI Center</h2>
        <p>Access all AI features in one place — Select a feature and start generating</p>
      </div>
      <div className="page-body">
        <div className="ai-center-grid">
          {aiFeatures.map(f => (
            <button
              key={f.key}
              className="ai-feature-btn"
              onClick={() => setSelectedFeature(f.key)}
              style={selectedFeature === f.key ? { borderColor: '#c084fc', background: 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(129,140,248,0.15))' } : {}}
            >
              <div className="icon">{f.icon}</div>
              <div>
                <div className="label">{f.label}</div>
                <div className="desc">{f.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="ai-chat-area">
          <div className="ai-chat-header">
            <span className="icon">{currentFeature?.icon}</span>
            <div>
              <strong>{currentFeature?.label}</strong>
              <span style={{ color: '#64748b', fontSize: 13, marginLeft: 8 }}>{currentFeature?.desc}</span>
            </div>
          </div>

          <div className="ai-chat-body">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>AI is thinking...</p>
              </div>
            ) : result ? (
              <AIOutput content={result} />
            ) : (
              <div className="empty-state">
                <div className="icon">💡</div>
                <p>Enter a prompt below and click Generate to get AI-powered results</p>
              </div>
            )}
          </div>

          <div className="ai-chat-input">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask the ${currentFeature?.label || 'AI'} anything...`}
              rows={2}
            />
            <button className="btn btn-ai" onClick={handleGenerate} disabled={loading || !prompt.trim()}>
              {loading ? <span className="spinner"></span> : '✨ Generate'}
            </button>
          </div>
        </div>

        {history.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#f1f5f9' }}>
              Recent Generations
            </h3>
            {history.map((h, i) => (
              <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="card-badge purple">
                    {aiFeatures.find(f => f.key === h.feature)?.icon} {aiFeatures.find(f => f.key === h.feature)?.label}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{h.time.toLocaleTimeString()}</span>
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
                  <strong>Prompt:</strong> {h.prompt.substring(0, 100)}{h.prompt.length > 100 ? '...' : ''}
                </p>
                <AIOutput content={h.result} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
