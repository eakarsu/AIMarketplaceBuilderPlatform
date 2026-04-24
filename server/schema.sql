-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Trip Planner
CREATE TABLE IF NOT EXISTS trip_plans (
  id SERIAL PRIMARY KEY,
  destination VARCHAR(255) NOT NULL,
  duration_days INTEGER NOT NULL,
  budget DECIMAL(10,2),
  travel_style VARCHAR(100),
  interests TEXT,
  ai_plan TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Content Generator
CREATE TABLE IF NOT EXISTS content_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  topic VARCHAR(255),
  tone VARCHAR(100),
  generated_content TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Code Assistant
CREATE TABLE IF NOT EXISTS code_snippets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  language VARCHAR(100) NOT NULL,
  description TEXT,
  code TEXT,
  ai_explanation TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Image Prompt Generator
CREATE TABLE IF NOT EXISTS image_prompts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  style VARCHAR(100),
  subject VARCHAR(255),
  mood VARCHAR(100),
  generated_prompt TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Business Plan Generator
CREATE TABLE IF NOT EXISTS business_plans (
  id SERIAL PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  target_market VARCHAR(255),
  budget DECIMAL(10,2),
  ai_plan TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Email Composer
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  email_type VARCHAR(100) NOT NULL,
  recipient_type VARCHAR(100),
  tone VARCHAR(100),
  generated_email TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Recipe Creator
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  cuisine VARCHAR(100),
  dietary_restrictions VARCHAR(255),
  ingredients TEXT,
  ai_recipe TEXT,
  difficulty VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Resume Builder
CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  experience_years INTEGER,
  skills TEXT,
  ai_resume TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Marketing Copy
CREATE TABLE IF NOT EXISTS marketing_copies (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  platform VARCHAR(100),
  target_audience VARCHAR(255),
  key_features TEXT,
  ai_copy TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Story Writer
CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  genre VARCHAR(100),
  setting VARCHAR(255),
  characters TEXT,
  ai_story TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Language Translator
CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  source_language VARCHAR(100) NOT NULL,
  target_language VARCHAR(100) NOT NULL,
  original_text TEXT,
  translated_text TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI SEO Optimizer
CREATE TABLE IF NOT EXISTS seo_items (
  id SERIAL PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  page_title VARCHAR(255),
  industry VARCHAR(100),
  keywords TEXT,
  ai_suggestions TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Chat Support Scripts
CREATE TABLE IF NOT EXISTS chat_scripts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  scenario VARCHAR(255),
  industry VARCHAR(100),
  tone VARCHAR(100),
  ai_script TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Product Description
CREATE TABLE IF NOT EXISTS product_descriptions (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  features TEXT,
  price DECIMAL(10,2),
  ai_description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Social Media Post
CREATE TABLE IF NOT EXISTS social_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  platform VARCHAR(100),
  topic VARCHAR(255),
  hashtags TEXT,
  ai_post TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Learning Path Generator
CREATE TABLE IF NOT EXISTS learning_paths (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  skill_level VARCHAR(100),
  goal TEXT,
  ai_path TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
