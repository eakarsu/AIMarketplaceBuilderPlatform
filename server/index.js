const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = require('./db');
const { callOpenRouter } = require('./openrouter');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth middleware
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

// ============ AUTH ROUTES ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
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

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ============ GENERIC CRUD HELPER ============
function createCrudRoutes(tableName, fields, aiConfig) {
  const router = express.Router();

  // GET all
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET one
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post('/', async (req, res) => {
    try {
      const cols = fields.filter(f => req.body[f] !== undefined);
      const vals = cols.map(f => req.body[f]);
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

  // PUT update
  router.put('/:id', async (req, res) => {
    try {
      const cols = fields.filter(f => req.body[f] !== undefined);
      const vals = cols.map(f => req.body[f]);
      const sets = cols.map((f, i) => `${f} = $${i + 1}`);
      vals.push(req.params.id);
      const result = await pool.query(
        `UPDATE ${tableName} SET ${sets.join(',')} WHERE id = $${vals.length} RETURNING *`,
        vals
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST AI generate
  if (aiConfig) {
    router.post('/:id/generate', async (req, res) => {
      try {
        const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        const item = result.rows[0];
        const userMessage = aiConfig.buildPrompt(item);
        const aiResult = await callOpenRouter(aiConfig.systemPrompt, userMessage);
        await pool.query(`UPDATE ${tableName} SET ${aiConfig.aiField} = $1 WHERE id = $2`, [aiResult, req.params.id]);
        res.json({ ...item, [aiConfig.aiField]: aiResult });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  return router;
}

// ============ FEATURE ROUTES ============

// 1. Trip Plans
app.use('/api/trip-plans', authMiddleware, createCrudRoutes('trip_plans',
  ['destination', 'duration_days', 'budget', 'travel_style', 'interests', 'ai_plan', 'status'],
  {
    systemPrompt: 'You are an expert travel planner. Create detailed day-by-day trip plans with estimated daily budgets, activities, meals, and travel tips. Format with clear headings and bullet points.',
    aiField: 'ai_plan',
    buildPrompt: (item) => `Create a detailed ${item.duration_days}-day trip plan for ${item.destination}. Budget: $${item.budget}. Travel style: ${item.travel_style}. Interests: ${item.interests}. Include day-by-day itinerary with morning, afternoon, and evening activities, estimated costs for each day, restaurant recommendations, and travel tips.`
  }
));

// 2. Content Items
app.use('/api/content-items', authMiddleware, createCrudRoutes('content_items',
  ['title', 'content_type', 'topic', 'tone', 'generated_content', 'status'],
  {
    systemPrompt: 'You are a professional content writer. Create high-quality, engaging content based on the given specifications. Use proper formatting with headings, paragraphs, and bullet points where appropriate.',
    aiField: 'generated_content',
    buildPrompt: (item) => `Write a ${item.content_type} titled "${item.title}" about ${item.topic}. Tone: ${item.tone}. Make it comprehensive, engaging, and well-structured.`
  }
));

// 3. Code Snippets
app.use('/api/code-snippets', authMiddleware, createCrudRoutes('code_snippets',
  ['title', 'language', 'description', 'code', 'ai_explanation', 'status'],
  {
    systemPrompt: 'You are an expert programmer. Generate clean, well-documented code with explanations. Include best practices and common pitfalls.',
    aiField: 'ai_explanation',
    buildPrompt: (item) => `Generate a ${item.language} code snippet for: "${item.title}" - ${item.description}. Provide the complete code with detailed comments and an explanation of how it works, including time/space complexity if applicable.`
  }
));

// 4. Image Prompts
app.use('/api/image-prompts', authMiddleware, createCrudRoutes('image_prompts',
  ['title', 'style', 'subject', 'mood', 'generated_prompt', 'status'],
  {
    systemPrompt: 'You are an expert AI image prompt engineer. Create detailed, effective prompts for AI image generation tools like DALL-E, Midjourney, and Stable Diffusion. Include style, composition, lighting, and mood details.',
    aiField: 'generated_prompt',
    buildPrompt: (item) => `Create a detailed AI image generation prompt for: "${item.title}". Style: ${item.style}. Subject: ${item.subject}. Mood: ${item.mood}. Include composition details, lighting, color palette, and camera angle suggestions.`
  }
));

// 5. Business Plans
app.use('/api/business-plans', authMiddleware, createCrudRoutes('business_plans',
  ['business_name', 'industry', 'target_market', 'budget', 'ai_plan', 'status'],
  {
    systemPrompt: 'You are a senior business consultant. Create comprehensive business plans with market analysis, financial projections, and strategic recommendations.',
    aiField: 'ai_plan',
    buildPrompt: (item) => `Create a business plan for "${item.business_name}" in the ${item.industry} industry. Target market: ${item.target_market}. Budget: $${item.budget}. Include executive summary, market analysis, revenue model, marketing strategy, and 3-year financial projections.`
  }
));

// 6. Email Templates
app.use('/api/email-templates', authMiddleware, createCrudRoutes('email_templates',
  ['subject', 'email_type', 'recipient_type', 'tone', 'generated_email', 'status'],
  {
    systemPrompt: 'You are an email marketing expert. Write compelling, professional emails that drive engagement and conversions. Include subject line suggestions and clear calls-to-action.',
    aiField: 'generated_email',
    buildPrompt: (item) => `Write a ${item.email_type} email with subject "${item.subject}". Target recipient: ${item.recipient_type}. Tone: ${item.tone}. Include a compelling opening, clear body, and strong call-to-action.`
  }
));

// 7. Recipes
app.use('/api/recipes', authMiddleware, createCrudRoutes('recipes',
  ['title', 'cuisine', 'dietary_restrictions', 'ingredients', 'ai_recipe', 'difficulty', 'status'],
  {
    systemPrompt: 'You are a professional chef. Create detailed recipes with exact measurements, step-by-step instructions, cooking tips, and nutritional information.',
    aiField: 'ai_recipe',
    buildPrompt: (item) => `Create a detailed recipe for "${item.title}". Cuisine: ${item.cuisine}. Dietary restrictions: ${item.dietary_restrictions}. Difficulty: ${item.difficulty}. Include ingredients with exact measurements, step-by-step instructions, cooking time, serving size, and nutritional estimates.`
  }
));

// 8. Resumes
app.use('/api/resumes', authMiddleware, createCrudRoutes('resumes',
  ['full_name', 'job_title', 'experience_years', 'skills', 'ai_resume', 'status'],
  {
    systemPrompt: 'You are a professional resume writer and career coach. Create ATS-optimized resumes that highlight achievements and skills effectively.',
    aiField: 'ai_resume',
    buildPrompt: (item) => `Create a professional resume for ${item.full_name}, applying for ${item.job_title} with ${item.experience_years} years of experience. Key skills: ${item.skills}. Include a professional summary, skills section, experience with quantified achievements, and education section.`
  }
));

// 9. Marketing Copies
app.use('/api/marketing-copies', authMiddleware, createCrudRoutes('marketing_copies',
  ['product_name', 'platform', 'target_audience', 'key_features', 'ai_copy', 'status'],
  {
    systemPrompt: 'You are a marketing copywriter expert. Create compelling, conversion-focused marketing copy tailored to specific platforms and audiences.',
    aiField: 'ai_copy',
    buildPrompt: (item) => `Write marketing copy for "${item.product_name}" on ${item.platform}. Target audience: ${item.target_audience}. Key features: ${item.key_features}. Include headline, body copy, call-to-action, and platform-specific formatting tips.`
  }
));

// 10. Stories
app.use('/api/stories', authMiddleware, createCrudRoutes('stories',
  ['title', 'genre', 'setting', 'characters', 'ai_story', 'status'],
  {
    systemPrompt: 'You are a creative fiction writer. Write engaging, vivid stories with compelling characters and plot twists. Use literary techniques and sensory details.',
    aiField: 'ai_story',
    buildPrompt: (item) => `Write a short story titled "${item.title}". Genre: ${item.genre}. Setting: ${item.setting}. Characters: ${item.characters}. Create an engaging narrative with vivid descriptions, dialogue, and a satisfying arc.`
  }
));

// 11. Translations
app.use('/api/translations', authMiddleware, createCrudRoutes('translations',
  ['title', 'source_language', 'target_language', 'original_text', 'translated_text', 'status'],
  {
    systemPrompt: 'You are a professional translator. Provide accurate, natural-sounding translations that preserve meaning, tone, and cultural context. Include notes on cultural nuances.',
    aiField: 'translated_text',
    buildPrompt: (item) => `Translate the following from ${item.source_language} to ${item.target_language}. Title: "${item.title}". Text: "${item.original_text}". Provide the translation and notes on any cultural adaptations made.`
  }
));

// 12. SEO Items
app.use('/api/seo-items', authMiddleware, createCrudRoutes('seo_items',
  ['url', 'page_title', 'industry', 'keywords', 'ai_suggestions', 'status'],
  {
    systemPrompt: 'You are an SEO expert. Provide comprehensive, actionable SEO recommendations including meta tags, content optimization, keyword strategy, and technical SEO improvements.',
    aiField: 'ai_suggestions',
    buildPrompt: (item) => `Analyze and provide SEO recommendations for: URL: ${item.url}, Page: "${item.page_title}", Industry: ${item.industry}, Current keywords: ${item.keywords}. Include meta title/description suggestions, content recommendations, keyword opportunities, and technical SEO tips.`
  }
));

// 13. Chat Scripts
app.use('/api/chat-scripts', authMiddleware, createCrudRoutes('chat_scripts',
  ['title', 'scenario', 'industry', 'tone', 'ai_script', 'status'],
  {
    systemPrompt: 'You are a customer service expert. Create professional, effective chat support scripts with multiple response paths, empathy statements, and resolution steps.',
    aiField: 'ai_script',
    buildPrompt: (item) => `Create a customer support chat script for: "${item.title}". Scenario: ${item.scenario}. Industry: ${item.industry}. Tone: ${item.tone}. Include greeting, discovery questions, resolution steps, escalation path, and closing.`
  }
));

// 14. Product Descriptions
app.use('/api/product-descriptions', authMiddleware, createCrudRoutes('product_descriptions',
  ['product_name', 'category', 'features', 'price', 'ai_description', 'status'],
  {
    systemPrompt: 'You are an e-commerce copywriter. Write compelling product descriptions that highlight benefits, create desire, and drive purchases. Use sensory language and power words.',
    aiField: 'ai_description',
    buildPrompt: (item) => `Write a compelling product description for "${item.product_name}". Category: ${item.category}. Price: $${item.price}. Features: ${item.features}. Include a catchy headline, benefit-focused description, key specifications, and urgency-creating closing.`
  }
));

// 15. Social Posts
app.use('/api/social-posts', authMiddleware, createCrudRoutes('social_posts',
  ['title', 'platform', 'topic', 'hashtags', 'ai_post', 'status'],
  {
    systemPrompt: 'You are a social media strategist. Create engaging, platform-optimized social media posts that drive engagement, shares, and followers.',
    aiField: 'ai_post',
    buildPrompt: (item) => `Create a ${item.platform} post about: "${item.title}". Topic: ${item.topic}. Suggested hashtags: ${item.hashtags}. Optimize for ${item.platform} best practices including ideal length, formatting, emojis, and engagement hooks.`
  }
));

// 16. Learning Paths
app.use('/api/learning-paths', authMiddleware, createCrudRoutes('learning_paths',
  ['title', 'subject', 'skill_level', 'goal', 'ai_path', 'status'],
  {
    systemPrompt: 'You are an education expert and curriculum designer. Create structured, actionable learning paths with clear milestones, resources, and timelines.',
    aiField: 'ai_path',
    buildPrompt: (item) => `Create a detailed learning path for "${item.title}". Subject: ${item.subject}. Current level: ${item.skill_level}. Goal: ${item.goal}. Include weekly breakdown, recommended resources (courses, books, projects), milestones, and estimated completion time.`
  }
));

// ============ AI CENTER - Direct AI Chat ============
app.post('/api/ai-center/generate', authMiddleware, async (req, res) => {
  try {
    const { feature, prompt } = req.body;
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
