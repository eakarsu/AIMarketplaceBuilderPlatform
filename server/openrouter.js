const fetch = require('node-fetch');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function callOpenRouter(systemPrompt, userMessage, maxTokens = 2048) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not configured');
  const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Marketplace Builder Platform',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data.error.message || 'OpenRouter API error');
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content || !String(content).trim()) throw new Error('OpenRouter returned empty content');
  return content;
}

module.exports = { callOpenRouter };
