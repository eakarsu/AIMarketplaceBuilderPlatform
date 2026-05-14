const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = require('./db');
const { callOpenRouter } = require('./openrouter');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// ============ AI RATE LIMITER ============
const rateLimit = require('express-rate-limit');
const aiRateLimiter = rateLimit({
  windowMs: 3600000,
  max: 20,
  keyGenerator: (req) => req.user ? `user:${req.user.id}` : req.ip,
  message: { error: 'AI rate limit exceeded. Maximum 20 requests per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============ HELPERS ============
function parseAIJson(text) {
  try { return JSON.parse(text); } catch (e) {}
  const s = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(s); } catch (e) {}
  const i = text.indexOf('{');
  const j = text.lastIndexOf('}');
  if (i !== -1 && j !== -1) {
    try { return JSON.parse(text.slice(i, j + 1)); } catch (e) {}
  }
  return null;
}

// ============ AUTH MIDDLEWARE ============
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ============ STARTUP: DB SCHEMA SETUP ============
async function setupDatabase() {
  try {
    // Add user_id to all feature tables
    const featureTables = [
      'trip_plans', 'content_items', 'code_snippets', 'image_prompts',
      'business_plans', 'email_templates', 'recipes', 'resumes',
      'marketing_copies', 'stories', 'translations', 'seo_items',
      'chat_scripts', 'product_descriptions', 'social_posts', 'learning_paths',
    ];

    for (const table of featureTables) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS user_id INTEGER`);
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE`);
    }

    // Add reset token fields to users
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP`);

    // AI results persistence table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        table_name VARCHAR(100),
        record_id INTEGER,
        ai_field VARCHAR(100),
        result TEXT,
        parsed_result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Database schema setup complete');
  } catch (err) {
    console.error('Database setup error:', err.message);
  }
}

setupDatabase();

// ============ AUTH ROUTES ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashed, name]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [token, expiry, email]
    );
    // In production: send email with reset link
    console.log(`Password reset token for ${email}: ${token}`);
    res.json({ message: 'If that email exists, a reset link has been sent.', debug_token: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired reset token' });
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashed, result.rows[0].id]
    );
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ PUBLIC TEMPLATES ============
app.get('/api/templates/public', async (req, res) => {
  try {
    const tableConfigs = [
      { table: 'trip_plans', aiField: 'ai_plan', nameField: 'destination', feature: 'trip-plans' },
      { table: 'content_items', aiField: 'generated_content', nameField: 'title', feature: 'content-items' },
      { table: 'code_snippets', aiField: 'ai_explanation', nameField: 'title', feature: 'code-snippets' },
      { table: 'image_prompts', aiField: 'generated_prompt', nameField: 'title', feature: 'image-prompts' },
      { table: 'business_plans', aiField: 'ai_plan', nameField: 'business_name', feature: 'business-plans' },
      { table: 'email_templates', aiField: 'generated_email', nameField: 'subject', feature: 'email-templates' },
      { table: 'recipes', aiField: 'ai_recipe', nameField: 'title', feature: 'recipes' },
      { table: 'resumes', aiField: 'ai_resume', nameField: 'full_name', feature: 'resumes' },
      { table: 'marketing_copies', aiField: 'ai_copy', nameField: 'product_name', feature: 'marketing-copies' },
      { table: 'stories', aiField: 'ai_story', nameField: 'title', feature: 'stories' },
      { table: 'translations', aiField: 'translated_text', nameField: 'title', feature: 'translations' },
      { table: 'seo_items', aiField: 'ai_suggestions', nameField: 'page_title', feature: 'seo-items' },
      { table: 'chat_scripts', aiField: 'ai_script', nameField: 'title', feature: 'chat-scripts' },
      { table: 'product_descriptions', aiField: 'ai_description', nameField: 'product_name', feature: 'product-descriptions' },
      { table: 'social_posts', aiField: 'ai_post', nameField: 'title', feature: 'social-posts' },
      { table: 'learning_paths', aiField: 'ai_path', nameField: 'title', feature: 'learning-paths' },
    ];

    const results = [];
    for (const cfg of tableConfigs) {
      const r = await pool.query(
        `SELECT id, '${cfg.feature}' as feature_type, '${cfg.table}' as table_name, ${cfg.nameField} as name, ${cfg.aiField} as ai_content, status, created_at FROM ${cfg.table} WHERE published = true ORDER BY created_at DESC LIMIT 20`
      );
      results.push(...r.rows);
    }

    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ GENERIC CRUD HELPER ============
function createCrudRoutes(tableName, fields, aiConfig) {
  const router = express.Router();

  // GET all with pagination + user scoping
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || null;
      const limit = parseInt(req.query.limit) || null;
      const userId = req.user.id;

      if (page && limit) {
        const offset = (page - 1) * limit;
        const countResult = await pool.query(
          `SELECT COUNT(*) FROM ${tableName} WHERE user_id = $1`,
          [userId]
        );
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);
        const result = await pool.query(
          `SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
          [userId, limit, offset]
        );
        return res.json({
          data: result.rows,
          pagination: { page, limit, total, totalPages },
        });
      }

      const result = await pool.query(
        `SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET one (user scoped)
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM ${tableName} WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create with input validation + user_id
  router.post('/', authMiddleware, async (req, res) => {
    try {
      // Validate required fields
      const requiredFields = fields.filter(f => f !== 'id');
      const missing = requiredFields.filter(f => {
        const aiFields = aiConfig ? [aiConfig.aiField] : [];
        const optionalFields = ['status', 'created_at', ...aiFields];
        return !optionalFields.includes(f) && (req.body[f] === undefined || req.body[f] === null || req.body[f] === '');
      });
      // Only error if ALL fields are missing (permissive validation)
      if (requiredFields.every(f => req.body[f] === undefined || req.body[f] === null || req.body[f] === '')) {
        return res.status(400).json({ error: 'Request body cannot be empty' });
      }

      const cols = fields.filter(f => f !== 'id' && req.body[f] !== undefined);
      const vals = cols.map(f => req.body[f]);
      cols.push('user_id');
      vals.push(req.user.id);
      const placeholders = cols.map((_, i) => `$${i + 1}`);
      const result = await pool.query(
        `INSERT INTO ${tableName} (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`,
        vals
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update (user scoped + validation)
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body cannot be empty' });
      }
      const cols = fields.filter(f => f !== 'id' && req.body[f] !== undefined);
      const vals = cols.map(f => req.body[f]);
      const sets = cols.map((f, i) => `${f} = $${i + 1}`);
      vals.push(req.params.id);
      vals.push(req.user.id);
      const result = await pool.query(
        `UPDATE ${tableName} SET ${sets.join(',')} WHERE id = $${vals.length - 1} AND user_id = $${vals.length} RETURNING *`,
        vals
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE (user scoped)
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM ${tableName} WHERE id = $1 AND user_id = $2 RETURNING *`,
        [req.params.id, req.user.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST AI generate (rate limited + persist)
  if (aiConfig) {
    router.post('/:id/generate', authMiddleware, aiRateLimiter, async (req, res) => {
      try {
        const result = await pool.query(
          `SELECT * FROM ${tableName} WHERE id = $1 AND user_id = $2`,
          [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        const item = result.rows[0];
        const userMessage = aiConfig.buildPrompt(item);
        const aiResult = await callOpenRouter(aiConfig.systemPrompt, userMessage);
        const parsed = parseAIJson(aiResult);

        await pool.query(
          `UPDATE ${tableName} SET ${aiConfig.aiField} = $1 WHERE id = $2 AND user_id = $3`,
          [aiResult, req.params.id, req.user.id]
        );

        // Persist AI result
        pool.query(
          'INSERT INTO ai_results (user_id, table_name, record_id, ai_field, result, parsed_result) VALUES ($1, $2, $3, $4, $5, $6)',
          [req.user.id, tableName, req.params.id, aiConfig.aiField, aiResult, JSON.stringify(parsed)]
        ).catch(err => console.error('Failed to persist AI result:', err.message));

        res.json({ ...item, [aiConfig.aiField]: aiResult, ai_parsed: parsed });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  // PUT publish toggle
  router.put('/:id/publish', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE ${tableName} SET published = NOT COALESCE(published, FALSE) WHERE id = $1 AND user_id = $2 RETURNING *`,
        [req.params.id, req.user.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

// ============ FEATURE ROUTES ============

// 1. Trip Plans
app.use('/api/trip-plans', createCrudRoutes('trip_plans',
  ['destination', 'duration_days', 'budget', 'travel_style', 'interests', 'ai_plan', 'status'],
  {
    systemPrompt: 'You are an expert travel planner. Create detailed day-by-day trip plans with estimated daily budgets, activities, meals, and travel tips. Format with clear headings and bullet points.',
    aiField: 'ai_plan',
    buildPrompt: (item) => `Create a detailed ${item.duration_days}-day trip plan for ${item.destination}. Budget: $${item.budget}. Travel style: ${item.travel_style}. Interests: ${item.interests}. Include day-by-day itinerary with morning, afternoon, and evening activities, estimated costs for each day, restaurant recommendations, and travel tips.`
  }
));

// 2. Content Items
app.use('/api/content-items', createCrudRoutes('content_items',
  ['title', 'content_type', 'topic', 'tone', 'generated_content', 'status'],
  {
    systemPrompt: 'You are a professional content writer. Create high-quality, engaging content based on the given specifications. Use proper formatting with headings, paragraphs, and bullet points where appropriate.',
    aiField: 'generated_content',
    buildPrompt: (item) => `Write a ${item.content_type} titled "${item.title}" about ${item.topic}. Tone: ${item.tone}. Make it comprehensive, engaging, and well-structured.`
  }
));

// 3. Code Snippets
app.use('/api/code-snippets', createCrudRoutes('code_snippets',
  ['title', 'language', 'description', 'code', 'ai_explanation', 'status'],
  {
    systemPrompt: 'You are an expert programmer. Generate clean, well-documented code with explanations. Include best practices and common pitfalls.',
    aiField: 'ai_explanation',
    buildPrompt: (item) => `Generate a ${item.language} code snippet for: "${item.title}" - ${item.description}. Provide the complete code with detailed comments and an explanation of how it works, including time/space complexity if applicable.`
  }
));

// 4. Image Prompts
app.use('/api/image-prompts', createCrudRoutes('image_prompts',
  ['title', 'style', 'subject', 'mood', 'generated_prompt', 'status'],
  {
    systemPrompt: 'You are an expert AI image prompt engineer. Create detailed, effective prompts for AI image generation tools like DALL-E, Midjourney, and Stable Diffusion. Include style, composition, lighting, and mood details.',
    aiField: 'generated_prompt',
    buildPrompt: (item) => `Create a detailed AI image generation prompt for: "${item.title}". Style: ${item.style}. Subject: ${item.subject}. Mood: ${item.mood}. Include composition details, lighting, color palette, and camera angle suggestions.`
  }
));

// 5. Business Plans
app.use('/api/business-plans', createCrudRoutes('business_plans',
  ['business_name', 'industry', 'target_market', 'budget', 'ai_plan', 'status'],
  {
    systemPrompt: 'You are a senior business consultant. Create comprehensive business plans with market analysis, financial projections, and strategic recommendations.',
    aiField: 'ai_plan',
    buildPrompt: (item) => `Create a business plan for "${item.business_name}" in the ${item.industry} industry. Target market: ${item.target_market}. Budget: $${item.budget}. Include executive summary, market analysis, revenue model, marketing strategy, and 3-year financial projections.`
  }
));

// 6. Email Templates
app.use('/api/email-templates', createCrudRoutes('email_templates',
  ['subject', 'email_type', 'recipient_type', 'tone', 'generated_email', 'status'],
  {
    systemPrompt: 'You are an email marketing expert. Write compelling, professional emails that drive engagement and conversions. Include subject line suggestions and clear calls-to-action.',
    aiField: 'generated_email',
    buildPrompt: (item) => `Write a ${item.email_type} email with subject "${item.subject}". Target recipient: ${item.recipient_type}. Tone: ${item.tone}. Include a compelling opening, clear body, and strong call-to-action.`
  }
));

// 7. Recipes
app.use('/api/recipes', createCrudRoutes('recipes',
  ['title', 'cuisine', 'dietary_restrictions', 'ingredients', 'ai_recipe', 'difficulty', 'status'],
  {
    systemPrompt: 'You are a professional chef. Create detailed recipes with exact measurements, step-by-step instructions, cooking tips, and nutritional information.',
    aiField: 'ai_recipe',
    buildPrompt: (item) => `Create a detailed recipe for "${item.title}". Cuisine: ${item.cuisine}. Dietary restrictions: ${item.dietary_restrictions}. Difficulty: ${item.difficulty}. Include ingredients with exact measurements, step-by-step instructions, cooking time, serving size, and nutritional estimates.`
  }
));

// 8. Resumes
app.use('/api/resumes', createCrudRoutes('resumes',
  ['full_name', 'job_title', 'experience_years', 'skills', 'ai_resume', 'status'],
  {
    systemPrompt: 'You are a professional resume writer and career coach. Create ATS-optimized resumes that highlight achievements and skills effectively.',
    aiField: 'ai_resume',
    buildPrompt: (item) => `Create a professional resume for ${item.full_name}, applying for ${item.job_title} with ${item.experience_years} years of experience. Key skills: ${item.skills}. Include a professional summary, skills section, experience with quantified achievements, and education section.`
  }
));

// 9. Marketing Copies
app.use('/api/marketing-copies', createCrudRoutes('marketing_copies',
  ['product_name', 'platform', 'target_audience', 'key_features', 'ai_copy', 'status'],
  {
    systemPrompt: 'You are a marketing copywriter expert. Create compelling, conversion-focused marketing copy tailored to specific platforms and audiences.',
    aiField: 'ai_copy',
    buildPrompt: (item) => `Write marketing copy for "${item.product_name}" on ${item.platform}. Target audience: ${item.target_audience}. Key features: ${item.key_features}. Include headline, body copy, call-to-action, and platform-specific formatting tips.`
  }
));

// 10. Stories
app.use('/api/stories', createCrudRoutes('stories',
  ['title', 'genre', 'setting', 'characters', 'ai_story', 'status'],
  {
    systemPrompt: 'You are a creative fiction writer. Write engaging, vivid stories with compelling characters and plot twists. Use literary techniques and sensory details.',
    aiField: 'ai_story',
    buildPrompt: (item) => `Write a short story titled "${item.title}". Genre: ${item.genre}. Setting: ${item.setting}. Characters: ${item.characters}. Create an engaging narrative with vivid descriptions, dialogue, and a satisfying arc.`
  }
));

// 11. Translations
app.use('/api/translations', createCrudRoutes('translations',
  ['title', 'source_language', 'target_language', 'original_text', 'translated_text', 'status'],
  {
    systemPrompt: 'You are a professional translator. Provide accurate, natural-sounding translations that preserve meaning, tone, and cultural context. Include notes on cultural nuances.',
    aiField: 'translated_text',
    buildPrompt: (item) => `Translate the following from ${item.source_language} to ${item.target_language}. Title: "${item.title}". Text: "${item.original_text}". Provide the translation and notes on any cultural adaptations made.`
  }
));

// 12. SEO Items
app.use('/api/seo-items', createCrudRoutes('seo_items',
  ['url', 'page_title', 'industry', 'keywords', 'ai_suggestions', 'status'],
  {
    systemPrompt: 'You are an SEO expert. Provide comprehensive, actionable SEO recommendations including meta tags, content optimization, keyword strategy, and technical SEO improvements.',
    aiField: 'ai_suggestions',
    buildPrompt: (item) => `Analyze and provide SEO recommendations for: URL: ${item.url}, Page: "${item.page_title}", Industry: ${item.industry}, Current keywords: ${item.keywords}. Include meta title/description suggestions, content recommendations, keyword opportunities, and technical SEO tips.`
  }
));

// 13. Chat Scripts
app.use('/api/chat-scripts', createCrudRoutes('chat_scripts',
  ['title', 'scenario', 'industry', 'tone', 'ai_script', 'status'],
  {
    systemPrompt: 'You are a customer service expert. Create professional, effective chat support scripts with multiple response paths, empathy statements, and resolution steps.',
    aiField: 'ai_script',
    buildPrompt: (item) => `Create a customer support chat script for: "${item.title}". Scenario: ${item.scenario}. Industry: ${item.industry}. Tone: ${item.tone}. Include greeting, discovery questions, resolution steps, escalation path, and closing.`
  }
));

// 14. Product Descriptions
app.use('/api/product-descriptions', createCrudRoutes('product_descriptions',
  ['product_name', 'category', 'features', 'price', 'ai_description', 'status'],
  {
    systemPrompt: 'You are an e-commerce copywriter. Write compelling product descriptions that highlight benefits, create desire, and drive purchases. Use sensory language and power words.',
    aiField: 'ai_description',
    buildPrompt: (item) => `Write a compelling product description for "${item.product_name}". Category: ${item.category}. Price: $${item.price}. Features: ${item.features}. Include a catchy headline, benefit-focused description, key specifications, and urgency-creating closing.`
  }
));

// 15. Social Posts
app.use('/api/social-posts', createCrudRoutes('social_posts',
  ['title', 'platform', 'topic', 'hashtags', 'ai_post', 'status'],
  {
    systemPrompt: 'You are a social media strategist. Create engaging, platform-optimized social media posts that drive engagement, shares, and followers.',
    aiField: 'ai_post',
    buildPrompt: (item) => `Create a ${item.platform} post about: "${item.title}". Topic: ${item.topic}. Suggested hashtags: ${item.hashtags}. Optimize for ${item.platform} best practices including ideal length, formatting, emojis, and engagement hooks.`
  }
));

// 16. Learning Paths
app.use('/api/learning-paths', createCrudRoutes('learning_paths',
  ['title', 'subject', 'skill_level', 'goal', 'ai_path', 'status'],
  {
    systemPrompt: 'You are an education expert and curriculum designer. Create structured, actionable learning paths with clear milestones, resources, and timelines.',
    aiField: 'ai_path',
    buildPrompt: (item) => `Create a detailed learning path for "${item.title}". Subject: ${item.subject}. Current level: ${item.skill_level}. Goal: ${item.goal}. Include weekly breakdown, recommended resources (courses, books, projects), milestones, and estimated completion time.`
  }
));

// ============ AI CENTER - Direct AI Chat ============
app.post('/api/ai-center/generate', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { feature, prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const systemPrompts = {
      'trip-planner': 'You are an expert travel planner. Help with any travel-related questions.',
      'content-writer': 'You are a professional content writer. Help create any type of content.',
      'code-assistant': 'You are an expert programmer. Help with coding questions and generate code.',
      'image-prompt': 'You are an AI image prompt engineer. Help create image generation prompts.',
      'business-advisor': 'You are a senior business consultant. Help with business strategy and planning.',
      'email-writer': 'You are an email marketing expert. Help compose professional emails.',
      'recipe-chef': 'You are a professional chef. Help with recipes and cooking advice.',
      'resume-builder': 'You are a career coach and resume expert. Help with resume writing.',
      'marketing-guru': 'You are a marketing copywriter. Help create marketing content.',
      'story-writer': 'You are a creative fiction writer. Help write stories and creative content.',
      'translator': 'You are a professional translator. Help translate text between languages.',
      'seo-expert': 'You are an SEO specialist. Help optimize content for search engines.',
      'chat-support': 'You are a customer service expert. Help create chat support scripts.',
      'product-writer': 'You are an e-commerce copywriter. Help write product descriptions.',
      'social-media': 'You are a social media strategist. Help create social media content.',
      'learning-coach': 'You are an education expert. Help create learning paths and study plans.',
      'general': 'You are a helpful AI assistant for the AI Marketplace platform. Help with any request.',
    };
    const sys = systemPrompts[feature] || systemPrompts['general'];
    const aiResult = await callOpenRouter(sys, prompt);
    res.json({ result: aiResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AI MARKETPLACE ENDPOINTS ============
// POST /api/ai/marketplace-recommendations — suggest products to a user
app.post('/api/ai/marketplace-recommendations', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { userInterests, recentViews = [], limit = 5 } = req.body;
    const systemPrompt = `You are a marketplace recommendation engine. Suggest products that match user intent. Return ONLY JSON.`;
    const userPrompt = `Recommend up to ${limit} marketplace products.

User interests: ${userInterests || 'unspecified'}
Recent views (titles): ${(recentViews || []).join('; ') || 'none'}

JSON: { "recommendations": [{"title": string, "category": string, "rationale": string, "confidence": number}], "personalization_notes": string }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    res.json({ raw: result, structured: parseAIJson(result) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/seller-match — match seller(s) to a customer need
app.post('/api/ai/seller-match', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { customerNeed, availableSellers = [] } = req.body;
    if (!customerNeed) return res.status(400).json({ error: 'customerNeed is required' });
    const systemPrompt = `You are a marketplace seller-match agent. Score sellers against a customer need. Return ONLY JSON.`;
    const userPrompt = `Customer need: ${customerNeed}

Available sellers: ${JSON.stringify(availableSellers).slice(0, 4000)}

JSON: { "matches": [{"seller": string, "match_score": number, "rationale": string, "concerns": [string]}], "fallback_advice": string }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    res.json({ raw: result, structured: parseAIJson(result) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/pricing-advisor — suggest seller pricing strategies
app.post('/api/ai/pricing-advisor', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { product, currentPrice, costBasis, competitorPrices = [], demandSignals } = req.body;
    if (!product) return res.status(400).json({ error: 'product is required' });
    const systemPrompt = `You are a marketplace pricing strategist. Recommend pricing tactics. Return ONLY JSON.`;
    const userPrompt = `Recommend pricing for this product.

Product: ${product}
Current price: ${currentPrice ?? 'unknown'}
Cost basis: ${costBasis ?? 'unknown'}
Competitor prices: ${(competitorPrices || []).join(', ') || 'none'}
Demand signals: ${demandSignals || 'unspecified'}

JSON: { "recommended_price": number, "price_band": {"low": number, "high": number}, "rationale": string, "tactics": [string], "expected_margin_impact": string }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    res.json({ raw: result, structured: parseAIJson(result) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/fraud-detection — text-only signal review for marketplace fraud
app.post('/api/ai/fraud-detection', authMiddleware, aiRateLimiter, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
  }
  try {
    const { listingTitle, listingDescription, sellerProfile, signals = [] } = req.body || {};
    if (!listingTitle && !listingDescription && !sellerProfile) {
      return res.status(400).json({ error: 'listingTitle, listingDescription, or sellerProfile is required' });
    }
    const systemPrompt = `You are a marketplace trust & safety analyst. Review a listing + seller profile for fraud signals (counterfeit, stolen-goods, payment redirection, off-platform contact, fake reviews, identity issues). Return ONLY JSON. Be conservative and explain reasoning.`;
    const userPrompt = `Review for fraud risk.

Listing title: ${listingTitle || 'n/a'}
Listing description: ${(listingDescription || 'n/a').slice(0, 4000)}
Seller profile: ${typeof sellerProfile === 'string' ? sellerProfile : JSON.stringify(sellerProfile || {}).slice(0, 2000)}
Additional signals: ${(signals || []).join('; ') || 'none'}

JSON: { "risk_score": number, "risk_level": "low|medium|high", "flags": [{"signal": string, "evidence": string, "severity": "low|medium|high"}], "recommended_action": "approve|review|hold|reject", "rationale": string }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    res.json({ raw: result, structured: parseAIJson(result) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/marketplace-curator-agent', require('./routes/marketplace-curator-agent'));
app.use('/api/personalized-recommender-stream', require('./routes/personalized-recommender-stream'));
app.use('/api/dispute-service-agent', require('./routes/dispute-service-agent'));
app.use('/api/creator-success-bot', require('./routes/creator-success-bot'));
app.use('/api/white-label-vertical', require('./routes/white-label-vertical'));

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_ai_content_quality_scorer = require('./routes/gap-ai-content-quality-scorer'); app.use('/api/gap-ai-content-quality-scorer', _gap_ai_content_quality_scorer); } catch(e) { console.error('gap mount fail ai-content-quality-scorer:', e.message); }
try { const _gap_ai_template_recommender = require('./routes/gap-ai-template-recommender'); app.use('/api/gap-ai-template-recommender', _gap_ai_template_recommender); } catch(e) { console.error('gap mount fail ai-template-recommender:', e.message); }
try { const _gap_ai_version_summarizer = require('./routes/gap-ai-version-summarizer'); app.use('/api/gap-ai-version-summarizer', _gap_ai_version_summarizer); } catch(e) { console.error('gap mount fail ai-version-summarizer:', e.message); }
try { const _gap_ai_buyer_intent = require('./routes/gap-ai-buyer-intent'); app.use('/api/gap-ai-buyer-intent', _gap_ai_buyer_intent); } catch(e) { console.error('gap mount fail ai-buyer-intent:', e.message); }
try { const _gap_review = require('./routes/gap-review'); app.use('/api/gap-review', _gap_review); } catch(e) { console.error('gap mount fail review:', e.message); }
try { const _gap_search = require('./routes/gap-search'); app.use('/api/gap-search', _gap_search); } catch(e) { console.error('gap mount fail search:', e.message); }
try { const _gap_seller = require('./routes/gap-seller'); app.use('/api/gap-seller', _gap_seller); } catch(e) { console.error('gap mount fail seller:', e.message); }
try { const _gap_payment = require('./routes/gap-payment'); app.use('/api/gap-payment', _gap_payment); } catch(e) { console.error('gap mount fail payment:', e.message); }
try { const _gap_notifications = require('./routes/gap-notifications'); app.use('/api/gap-notifications', _gap_notifications); } catch(e) { console.error('gap mount fail notifications:', e.message); }
try { const _gap_order = require('./routes/gap-order'); app.use('/api/gap-order', _gap_order); } catch(e) { console.error('gap mount fail order:', e.message); }
try { const _gap_webhooks = require('./routes/gap-webhooks'); app.use('/api/gap-webhooks', _gap_webhooks); } catch(e) { console.error('gap mount fail webhooks:', e.message); }
try { const _gap_dispute = require('./routes/gap-dispute'); app.use('/api/gap-dispute', _gap_dispute); } catch(e) { console.error('gap mount fail dispute:', e.message); }
// === End Batch 05 Mounts ===
