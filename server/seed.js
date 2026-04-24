const pool = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created successfully');

    // Seed user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(
      `INSERT INTO users (email, password, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING`,
      ['admin@aimarket.com', hashedPassword, 'Admin User']
    );

    // Seed Trip Plans
    const tripPlans = [
      { destination: 'Tokyo, Japan', duration_days: 7, budget: 3500, travel_style: 'Cultural', interests: 'Temples, Food, Technology', status: 'active' },
      { destination: 'Paris, France', duration_days: 5, budget: 4000, travel_style: 'Romantic', interests: 'Art, Cuisine, Architecture', status: 'active' },
      { destination: 'Bali, Indonesia', duration_days: 10, budget: 2000, travel_style: 'Adventure', interests: 'Beaches, Surfing, Temples', status: 'active' },
      { destination: 'New York City, USA', duration_days: 4, budget: 5000, travel_style: 'Urban Explorer', interests: 'Broadway, Museums, Food', status: 'active' },
      { destination: 'Machu Picchu, Peru', duration_days: 8, budget: 2500, travel_style: 'Adventure', interests: 'Hiking, History, Nature', status: 'active' },
      { destination: 'Santorini, Greece', duration_days: 6, budget: 3000, travel_style: 'Relaxation', interests: 'Beaches, Wine, Sunsets', status: 'active' },
      { destination: 'Dubai, UAE', duration_days: 5, budget: 6000, travel_style: 'Luxury', interests: 'Shopping, Architecture, Desert Safari', status: 'active' },
      { destination: 'Iceland', duration_days: 7, budget: 4500, travel_style: 'Adventure', interests: 'Northern Lights, Glaciers, Hot Springs', status: 'active' },
      { destination: 'Rome, Italy', duration_days: 6, budget: 3500, travel_style: 'Cultural', interests: 'History, Food, Art', status: 'active' },
      { destination: 'Bangkok, Thailand', duration_days: 8, budget: 1500, travel_style: 'Budget', interests: 'Street Food, Temples, Markets', status: 'active' },
      { destination: 'Cape Town, South Africa', duration_days: 9, budget: 3000, travel_style: 'Adventure', interests: 'Safari, Wine, Table Mountain', status: 'active' },
      { destination: 'Barcelona, Spain', duration_days: 5, budget: 2800, travel_style: 'Cultural', interests: 'Gaudi, Tapas, Beaches', status: 'active' },
      { destination: 'Maldives', duration_days: 7, budget: 8000, travel_style: 'Luxury', interests: 'Diving, Spa, Water Villas', status: 'active' },
      { destination: 'Kyoto, Japan', duration_days: 4, budget: 2000, travel_style: 'Cultural', interests: 'Zen Gardens, Tea Ceremony, Geisha District', status: 'active' },
      { destination: 'Marrakech, Morocco', duration_days: 5, budget: 1800, travel_style: 'Adventure', interests: 'Souks, Sahara, Riads', status: 'active' },
    ];
    for (const tp of tripPlans) {
      await client.query(
        `INSERT INTO trip_plans (destination, duration_days, budget, travel_style, interests, status) VALUES ($1,$2,$3,$4,$5,$6)`,
        [tp.destination, tp.duration_days, tp.budget, tp.travel_style, tp.interests, tp.status]
      );
    }
    console.log('Trip plans seeded');

    // Seed Content Items
    const contentItems = [
      { title: 'Top 10 AI Trends 2025', content_type: 'Blog Post', topic: 'Artificial Intelligence', tone: 'Professional' },
      { title: 'Remote Work Best Practices', content_type: 'Article', topic: 'Productivity', tone: 'Informative' },
      { title: 'Startup Funding Guide', content_type: 'Whitepaper', topic: 'Entrepreneurship', tone: 'Authoritative' },
      { title: 'Healthy Eating on a Budget', content_type: 'Blog Post', topic: 'Health', tone: 'Friendly' },
      { title: 'Cybersecurity Essentials', content_type: 'Tutorial', topic: 'Security', tone: 'Technical' },
      { title: 'Digital Marketing 101', content_type: 'Guide', topic: 'Marketing', tone: 'Educational' },
      { title: 'Climate Change Solutions', content_type: 'Article', topic: 'Environment', tone: 'Urgent' },
      { title: 'Machine Learning for Beginners', content_type: 'Tutorial', topic: 'Data Science', tone: 'Beginner-friendly' },
      { title: 'Personal Finance Tips', content_type: 'Blog Post', topic: 'Finance', tone: 'Conversational' },
      { title: 'Future of Electric Vehicles', content_type: 'Article', topic: 'Technology', tone: 'Analytical' },
      { title: 'Meditation & Mindfulness', content_type: 'Blog Post', topic: 'Wellness', tone: 'Calming' },
      { title: 'Web3 Explained Simply', content_type: 'Guide', topic: 'Blockchain', tone: 'Simple' },
      { title: 'Leadership in Tech', content_type: 'Article', topic: 'Management', tone: 'Inspirational' },
      { title: 'Home Workout Routines', content_type: 'Blog Post', topic: 'Fitness', tone: 'Energetic' },
      { title: 'Photography Tips for Social Media', content_type: 'Tutorial', topic: 'Photography', tone: 'Creative' },
    ];
    for (const ci of contentItems) {
      await client.query(
        `INSERT INTO content_items (title, content_type, topic, tone) VALUES ($1,$2,$3,$4)`,
        [ci.title, ci.content_type, ci.topic, ci.tone]
      );
    }
    console.log('Content items seeded');

    // Seed Code Snippets
    const codeSnippets = [
      { title: 'React Custom Hook - useDebounce', language: 'JavaScript', description: 'Debounce hook for input fields' },
      { title: 'Python FastAPI CRUD', language: 'Python', description: 'RESTful API with FastAPI' },
      { title: 'Go Goroutine Worker Pool', language: 'Go', description: 'Concurrent worker pool pattern' },
      { title: 'TypeScript Generic Repository', language: 'TypeScript', description: 'Generic data access layer' },
      { title: 'Rust Error Handling Pattern', language: 'Rust', description: 'Custom error types with thiserror' },
      { title: 'SQL Window Functions', language: 'SQL', description: 'Advanced analytics queries' },
      { title: 'Docker Multi-stage Build', language: 'Dockerfile', description: 'Optimized container build' },
      { title: 'React Context + Reducer', language: 'JavaScript', description: 'State management pattern' },
      { title: 'Python Data Pipeline', language: 'Python', description: 'ETL pipeline with pandas' },
      { title: 'Kubernetes Deployment YAML', language: 'YAML', description: 'K8s deployment configuration' },
      { title: 'GraphQL Schema Design', language: 'GraphQL', description: 'E-commerce schema example' },
      { title: 'CSS Grid Layout System', language: 'CSS', description: 'Responsive grid framework' },
      { title: 'Node.js Stream Processing', language: 'JavaScript', description: 'Large file processing with streams' },
      { title: 'Java Spring Security Config', language: 'Java', description: 'JWT authentication setup' },
      { title: 'Shell Script CI/CD Pipeline', language: 'Bash', description: 'Automated deployment script' },
    ];
    for (const cs of codeSnippets) {
      await client.query(
        `INSERT INTO code_snippets (title, language, description) VALUES ($1,$2,$3)`,
        [cs.title, cs.language, cs.description]
      );
    }
    console.log('Code snippets seeded');

    // Seed Image Prompts
    const imagePrompts = [
      { title: 'Cyberpunk Cityscape', style: 'Digital Art', subject: 'Futuristic city', mood: 'Neon-lit' },
      { title: 'Serene Mountain Lake', style: 'Photography', subject: 'Nature landscape', mood: 'Peaceful' },
      { title: 'Abstract Data Flow', style: 'Abstract', subject: 'Technology concept', mood: 'Dynamic' },
      { title: 'Vintage Coffee Shop', style: 'Watercolor', subject: 'Interior scene', mood: 'Cozy' },
      { title: 'Space Station Interior', style: 'Sci-Fi', subject: 'Space exploration', mood: 'Mysterious' },
      { title: 'Enchanted Forest', style: 'Fantasy', subject: 'Magical woodland', mood: 'Mystical' },
      { title: 'Minimalist Logo Design', style: 'Vector', subject: 'Brand identity', mood: 'Clean' },
      { title: 'Ocean Sunset Portrait', style: 'Photography', subject: 'Person at beach', mood: 'Golden hour' },
      { title: 'Steampunk Machinery', style: 'Illustration', subject: 'Victorian tech', mood: 'Industrial' },
      { title: 'Japanese Cherry Blossoms', style: 'Anime', subject: 'Spring garden', mood: 'Romantic' },
      { title: 'Urban Street Art', style: 'Graffiti', subject: 'City wall mural', mood: 'Vibrant' },
      { title: 'Underwater Kingdom', style: 'Fantasy', subject: 'Deep sea city', mood: 'Ethereal' },
      { title: 'Retro Gaming Scene', style: 'Pixel Art', subject: 'Video game world', mood: 'Nostalgic' },
      { title: 'Nordic Cabin Winter', style: 'Photography', subject: 'Snowy cabin', mood: 'Serene' },
      { title: 'Art Deco Poster', style: 'Vintage', subject: 'Event advertisement', mood: 'Elegant' },
    ];
    for (const ip of imagePrompts) {
      await client.query(
        `INSERT INTO image_prompts (title, style, subject, mood) VALUES ($1,$2,$3,$4)`,
        [ip.title, ip.style, ip.subject, ip.mood]
      );
    }
    console.log('Image prompts seeded');

    // Seed Business Plans
    const businessPlans = [
      { business_name: 'EcoDelivery', industry: 'Logistics', target_market: 'Urban consumers', budget: 500000 },
      { business_name: 'HealthAI Pro', industry: 'Healthcare', target_market: 'Clinics & hospitals', budget: 1000000 },
      { business_name: 'LearnFlow', industry: 'EdTech', target_market: 'K-12 students', budget: 250000 },
      { business_name: 'FreshBite', industry: 'Food & Beverage', target_market: 'Health-conscious millennials', budget: 150000 },
      { business_name: 'SecureVault', industry: 'Cybersecurity', target_market: 'SMBs', budget: 750000 },
      { business_name: 'PetPal', industry: 'Pet Services', target_market: 'Pet owners', budget: 100000 },
      { business_name: 'GreenBuild', industry: 'Construction', target_market: 'Eco-builders', budget: 2000000 },
      { business_name: 'FitTrack', industry: 'Fitness', target_market: 'Gym enthusiasts', budget: 200000 },
      { business_name: 'ArtisanHub', industry: 'E-commerce', target_market: 'Craft lovers', budget: 80000 },
      { business_name: 'TravelMate AI', industry: 'Travel', target_market: 'Solo travelers', budget: 300000 },
      { business_name: 'CodeMentor', industry: 'Education', target_market: 'Junior developers', budget: 180000 },
      { business_name: 'SmartFarm', industry: 'Agriculture', target_market: 'Small farmers', budget: 400000 },
      { business_name: 'FinWise', industry: 'Fintech', target_market: 'Young professionals', budget: 600000 },
      { business_name: 'MediaPulse', industry: 'Media', target_market: 'Content creators', budget: 120000 },
      { business_name: 'CleanTech Solutions', industry: 'Energy', target_market: 'Residential', budget: 900000 },
    ];
    for (const bp of businessPlans) {
      await client.query(
        `INSERT INTO business_plans (business_name, industry, target_market, budget) VALUES ($1,$2,$3,$4)`,
        [bp.business_name, bp.industry, bp.target_market, bp.budget]
      );
    }
    console.log('Business plans seeded');

    // Seed Email Templates
    const emailTemplates = [
      { subject: 'Welcome to Our Platform', email_type: 'Onboarding', recipient_type: 'New User', tone: 'Warm' },
      { subject: 'Your Weekly Report', email_type: 'Newsletter', recipient_type: 'Subscriber', tone: 'Professional' },
      { subject: 'Special Offer Inside!', email_type: 'Promotional', recipient_type: 'Customer', tone: 'Exciting' },
      { subject: 'We Miss You', email_type: 'Re-engagement', recipient_type: 'Inactive User', tone: 'Friendly' },
      { subject: 'Invoice #1234', email_type: 'Transactional', recipient_type: 'Client', tone: 'Formal' },
      { subject: 'Thank You for Your Purchase', email_type: 'Confirmation', recipient_type: 'Buyer', tone: 'Grateful' },
      { subject: 'Your Free Trial is Ending', email_type: 'Reminder', recipient_type: 'Trial User', tone: 'Urgent' },
      { subject: 'Product Update - New Features', email_type: 'Announcement', recipient_type: 'All Users', tone: 'Enthusiastic' },
      { subject: 'Feedback Request', email_type: 'Survey', recipient_type: 'Active User', tone: 'Polite' },
      { subject: 'Partnership Opportunity', email_type: 'Outreach', recipient_type: 'Business', tone: 'Professional' },
      { subject: 'Security Alert', email_type: 'Alert', recipient_type: 'All Users', tone: 'Serious' },
      { subject: 'Event Invitation', email_type: 'Invitation', recipient_type: 'VIP', tone: 'Elegant' },
      { subject: 'Year in Review', email_type: 'Newsletter', recipient_type: 'All Users', tone: 'Reflective' },
      { subject: 'Referral Bonus', email_type: 'Promotional', recipient_type: 'Loyal Customer', tone: 'Rewarding' },
      { subject: 'Apology for Service Disruption', email_type: 'Apology', recipient_type: 'Affected Users', tone: 'Sincere' },
    ];
    for (const et of emailTemplates) {
      await client.query(
        `INSERT INTO email_templates (subject, email_type, recipient_type, tone) VALUES ($1,$2,$3,$4)`,
        [et.subject, et.email_type, et.recipient_type, et.tone]
      );
    }
    console.log('Email templates seeded');

    // Seed Recipes
    const recipes = [
      { title: 'Truffle Mushroom Risotto', cuisine: 'Italian', dietary_restrictions: 'Vegetarian', difficulty: 'Medium' },
      { title: 'Spicy Thai Basil Chicken', cuisine: 'Thai', dietary_restrictions: 'Gluten-free', difficulty: 'Easy' },
      { title: 'Classic French Onion Soup', cuisine: 'French', dietary_restrictions: 'None', difficulty: 'Medium' },
      { title: 'Vegan Buddha Bowl', cuisine: 'International', dietary_restrictions: 'Vegan', difficulty: 'Easy' },
      { title: 'Japanese Ramen from Scratch', cuisine: 'Japanese', dietary_restrictions: 'None', difficulty: 'Hard' },
      { title: 'Mexican Street Tacos', cuisine: 'Mexican', dietary_restrictions: 'None', difficulty: 'Easy' },
      { title: 'Indian Butter Chicken', cuisine: 'Indian', dietary_restrictions: 'Gluten-free', difficulty: 'Medium' },
      { title: 'Mediterranean Grilled Fish', cuisine: 'Mediterranean', dietary_restrictions: 'Pescatarian', difficulty: 'Easy' },
      { title: 'Korean Bibimbap', cuisine: 'Korean', dietary_restrictions: 'None', difficulty: 'Medium' },
      { title: 'Chocolate Lava Cake', cuisine: 'French', dietary_restrictions: 'Vegetarian', difficulty: 'Hard' },
      { title: 'Greek Moussaka', cuisine: 'Greek', dietary_restrictions: 'None', difficulty: 'Hard' },
      { title: 'Vietnamese Pho', cuisine: 'Vietnamese', dietary_restrictions: 'Gluten-free', difficulty: 'Medium' },
      { title: 'Avocado Sushi Roll', cuisine: 'Japanese', dietary_restrictions: 'Vegan', difficulty: 'Medium' },
      { title: 'Moroccan Tagine', cuisine: 'Moroccan', dietary_restrictions: 'Halal', difficulty: 'Medium' },
      { title: 'Brazilian Acai Bowl', cuisine: 'Brazilian', dietary_restrictions: 'Vegan', difficulty: 'Easy' },
    ];
    for (const r of recipes) {
      await client.query(
        `INSERT INTO recipes (title, cuisine, dietary_restrictions, difficulty) VALUES ($1,$2,$3,$4)`,
        [r.title, r.cuisine, r.dietary_restrictions, r.difficulty]
      );
    }
    console.log('Recipes seeded');

    // Seed Resumes
    const resumes = [
      { full_name: 'Sarah Johnson', job_title: 'Senior Software Engineer', experience_years: 8, skills: 'React, Node.js, AWS, Python' },
      { full_name: 'Michael Chen', job_title: 'Data Scientist', experience_years: 5, skills: 'Python, TensorFlow, SQL, Spark' },
      { full_name: 'Emily Rodriguez', job_title: 'Product Manager', experience_years: 6, skills: 'Agile, Jira, Analytics, Strategy' },
      { full_name: 'James Wilson', job_title: 'DevOps Engineer', experience_years: 4, skills: 'Docker, Kubernetes, CI/CD, Terraform' },
      { full_name: 'Lisa Park', job_title: 'UX Designer', experience_years: 7, skills: 'Figma, User Research, Prototyping, Design Systems' },
      { full_name: 'David Kim', job_title: 'Full Stack Developer', experience_years: 3, skills: 'React, Django, PostgreSQL, Redis' },
      { full_name: 'Anna Martinez', job_title: 'Marketing Director', experience_years: 10, skills: 'SEO, Content Strategy, Analytics, Brand Management' },
      { full_name: 'Robert Taylor', job_title: 'Cloud Architect', experience_years: 12, skills: 'AWS, Azure, Microservices, System Design' },
      { full_name: 'Sophie Brown', job_title: 'AI/ML Engineer', experience_years: 4, skills: 'PyTorch, NLP, Computer Vision, MLOps' },
      { full_name: 'Thomas Anderson', job_title: 'Security Engineer', experience_years: 6, skills: 'Penetration Testing, SOC, SIEM, Incident Response' },
      { full_name: 'Maria Garcia', job_title: 'Frontend Developer', experience_years: 5, skills: 'Vue.js, TypeScript, CSS, Accessibility' },
      { full_name: 'Kevin O\'Brien', job_title: 'CTO', experience_years: 15, skills: 'Leadership, Architecture, Strategy, Team Building' },
      { full_name: 'Rachel Lee', job_title: 'QA Lead', experience_years: 7, skills: 'Selenium, Cypress, Test Strategy, Automation' },
      { full_name: 'Chris Patel', job_title: 'Mobile Developer', experience_years: 5, skills: 'React Native, Swift, Kotlin, Firebase' },
      { full_name: 'Natalie Wright', job_title: 'Technical Writer', experience_years: 4, skills: 'Documentation, API Docs, Markdown, Developer Experience' },
    ];
    for (const r of resumes) {
      await client.query(
        `INSERT INTO resumes (full_name, job_title, experience_years, skills) VALUES ($1,$2,$3,$4)`,
        [r.full_name, r.job_title, r.experience_years, r.skills]
      );
    }
    console.log('Resumes seeded');

    // Seed Marketing Copies
    const marketingCopies = [
      { product_name: 'SmartWatch Pro', platform: 'Facebook', target_audience: 'Fitness enthusiasts', key_features: 'Heart rate monitor, GPS, 7-day battery' },
      { product_name: 'CloudSync App', platform: 'Google Ads', target_audience: 'Remote workers', key_features: 'Real-time sync, 1TB storage, encryption' },
      { product_name: 'EcoBottle', platform: 'Instagram', target_audience: 'Eco-conscious consumers', key_features: 'Biodegradable, insulated, BPA-free' },
      { product_name: 'CodeLearn Academy', platform: 'LinkedIn', target_audience: 'Career changers', key_features: 'Mentorship, project-based, job guarantee' },
      { product_name: 'MealPrep Box', platform: 'TikTok', target_audience: 'Busy professionals', key_features: 'Pre-portioned, organic, chef-designed' },
      { product_name: 'SecurePass Manager', platform: 'Twitter', target_audience: 'Security-aware users', key_features: 'Zero-knowledge, biometric, cross-platform' },
      { product_name: 'PetHealth Tracker', platform: 'Facebook', target_audience: 'Pet owners', key_features: 'Activity monitoring, vet alerts, GPS collar' },
      { product_name: 'ArtStudio Digital', platform: 'Pinterest', target_audience: 'Digital artists', key_features: 'AI brushes, layer support, cloud save' },
      { product_name: 'FreshRoast Coffee', platform: 'Instagram', target_audience: 'Coffee lovers', key_features: 'Single origin, freshly roasted, subscription' },
      { product_name: 'StudyBuddy AI', platform: 'YouTube', target_audience: 'College students', key_features: 'AI tutoring, flashcards, progress tracking' },
      { product_name: 'HomeGym Set', platform: 'Google Ads', target_audience: 'Home fitness fans', key_features: 'Compact, adjustable, all-in-one' },
      { product_name: 'TravelLight Luggage', platform: 'Facebook', target_audience: 'Frequent travelers', key_features: 'Lightweight, expandable, GPS tracker' },
      { product_name: 'MindfulMe App', platform: 'Instagram', target_audience: 'Stress-relief seekers', key_features: 'Guided meditation, sleep stories, mood tracker' },
      { product_name: 'ProInvoice SaaS', platform: 'LinkedIn', target_audience: 'Freelancers', key_features: 'Auto-billing, tax calculation, client portal' },
      { product_name: 'KidsCode Toy', platform: 'Facebook', target_audience: 'Parents of 6-12 year olds', key_features: 'STEM learning, screen-free, programmable' },
    ];
    for (const mc of marketingCopies) {
      await client.query(
        `INSERT INTO marketing_copies (product_name, platform, target_audience, key_features) VALUES ($1,$2,$3,$4)`,
        [mc.product_name, mc.platform, mc.target_audience, mc.key_features]
      );
    }
    console.log('Marketing copies seeded');

    // Seed Stories
    const stories = [
      { title: 'The Last Algorithm', genre: 'Sci-Fi', setting: 'Year 2150 space station', characters: 'AI researcher, sentient AI' },
      { title: 'Whispers in the Garden', genre: 'Mystery', setting: 'English countryside estate', characters: 'Detective, gardener, heiress' },
      { title: 'Neon Dreams', genre: 'Cyberpunk', setting: 'Neo-Tokyo 2080', characters: 'Hacker, corporate spy' },
      { title: 'The Forgotten Kingdom', genre: 'Fantasy', setting: 'Medieval realm', characters: 'Young mage, dragon, wise elder' },
      { title: 'Parallel Hearts', genre: 'Romance', setting: 'Modern-day New York', characters: 'Chef, musician' },
      { title: 'Code Red', genre: 'Thriller', setting: 'CIA headquarters', characters: 'Agent, mole, director' },
      { title: 'Starbound', genre: 'Space Opera', setting: 'Galactic frontier', characters: 'Ship captain, alien diplomat' },
      { title: 'The Clockmaker\'s Daughter', genre: 'Historical Fiction', setting: 'Victorian London', characters: 'Inventor, orphan girl' },
      { title: 'Wild Reset', genre: 'Post-Apocalyptic', setting: 'Overgrown cities', characters: 'Survivor, robot companion' },
      { title: 'Mind Games', genre: 'Psychological', setting: 'Research facility', characters: 'Psychologist, patient, nurse' },
      { title: 'The Baker of Amalfi', genre: 'Literary Fiction', setting: 'Italian coast', characters: 'Baker, tourist, local historian' },
      { title: 'Dragon\'s Code', genre: 'Fantasy/Tech', setting: 'World where magic is code', characters: 'Programmer-mage, bug-dragon' },
      { title: 'Under the Red Sky', genre: 'Horror', setting: 'Abandoned Mars colony', characters: 'Rescue team, unknown entity' },
      { title: 'Echoes of Tomorrow', genre: 'Time Travel', setting: 'Multiple timelines', characters: 'Scientist, future self' },
      { title: 'The Street Artist', genre: 'Coming of Age', setting: 'Brooklyn neighborhood', characters: 'Teen artist, mentor, rival' },
    ];
    for (const s of stories) {
      await client.query(
        `INSERT INTO stories (title, genre, setting, characters) VALUES ($1,$2,$3,$4)`,
        [s.title, s.genre, s.setting, s.characters]
      );
    }
    console.log('Stories seeded');

    // Seed Translations
    const translations = [
      { title: 'Business Proposal', source_language: 'English', target_language: 'Spanish', original_text: 'We propose a strategic partnership to expand into the Latin American market.' },
      { title: 'Product Manual', source_language: 'English', target_language: 'Japanese', original_text: 'Please read all safety instructions before operating this device.' },
      { title: 'Marketing Slogan', source_language: 'English', target_language: 'French', original_text: 'Innovation that moves you forward.' },
      { title: 'Legal Contract Clause', source_language: 'English', target_language: 'German', original_text: 'The parties agree to resolve disputes through binding arbitration.' },
      { title: 'Restaurant Menu', source_language: 'English', target_language: 'Italian', original_text: 'Grilled salmon with seasonal vegetables and lemon butter sauce.' },
      { title: 'Travel Guide Excerpt', source_language: 'English', target_language: 'Portuguese', original_text: 'The historic center features stunning architecture from the 18th century.' },
      { title: 'Tech Documentation', source_language: 'English', target_language: 'Chinese', original_text: 'Initialize the SDK by calling the setup method with your API key.' },
      { title: 'Medical Instructions', source_language: 'English', target_language: 'Arabic', original_text: 'Take one tablet twice daily with food. Consult your doctor if symptoms persist.' },
      { title: 'Email Newsletter', source_language: 'English', target_language: 'Korean', original_text: 'Discover our latest collection designed for the modern professional.' },
      { title: 'Social Media Post', source_language: 'English', target_language: 'Hindi', original_text: 'Join us this weekend for an exclusive live event with special guests!' },
      { title: 'Academic Abstract', source_language: 'English', target_language: 'Russian', original_text: 'This study examines the impact of artificial intelligence on healthcare outcomes.' },
      { title: 'Customer Review', source_language: 'English', target_language: 'Turkish', original_text: 'Excellent product quality and fast shipping. Highly recommended!' },
      { title: 'Press Release', source_language: 'English', target_language: 'Dutch', original_text: 'We are excited to announce our expansion into the European market.' },
      { title: 'App Store Description', source_language: 'English', target_language: 'Swedish', original_text: 'The smartest way to manage your daily tasks and boost productivity.' },
      { title: 'Greeting Card', source_language: 'English', target_language: 'Thai', original_text: 'Wishing you joy, health, and prosperity in the new year.' },
    ];
    for (const t of translations) {
      await client.query(
        `INSERT INTO translations (title, source_language, target_language, original_text) VALUES ($1,$2,$3,$4)`,
        [t.title, t.source_language, t.target_language, t.original_text]
      );
    }
    console.log('Translations seeded');

    // Seed SEO Items
    const seoItems = [
      { url: 'https://example.com/products', page_title: 'Our Products', industry: 'E-commerce', keywords: 'online store, buy products, deals' },
      { url: 'https://blog.example.com', page_title: 'Tech Blog', industry: 'Technology', keywords: 'tech news, tutorials, reviews' },
      { url: 'https://fitness.example.com', page_title: 'FitLife Home', industry: 'Fitness', keywords: 'workout plans, fitness tips, nutrition' },
      { url: 'https://legal.example.com', page_title: 'Legal Services', industry: 'Legal', keywords: 'attorney, law firm, consultation' },
      { url: 'https://realestate.example.com', page_title: 'Dream Homes', industry: 'Real Estate', keywords: 'homes for sale, real estate agent, property' },
      { url: 'https://edu.example.com', page_title: 'Online Courses', industry: 'Education', keywords: 'online learning, courses, certification' },
      { url: 'https://food.example.com', page_title: 'FoodieHub', industry: 'Food & Beverage', keywords: 'recipes, restaurant reviews, cooking' },
      { url: 'https://travel.example.com', page_title: 'WanderMore', industry: 'Travel', keywords: 'travel deals, vacation packages, flights' },
      { url: 'https://health.example.com', page_title: 'HealthFirst', industry: 'Healthcare', keywords: 'health tips, medical advice, wellness' },
      { url: 'https://finance.example.com', page_title: 'MoneyWise', industry: 'Finance', keywords: 'investing, savings, financial planning' },
      { url: 'https://auto.example.com', page_title: 'AutoWorld', industry: 'Automotive', keywords: 'car reviews, auto deals, vehicles' },
      { url: 'https://pet.example.com', page_title: 'PetLove', industry: 'Pet Care', keywords: 'pet supplies, veterinary, pet adoption' },
      { url: 'https://fashion.example.com', page_title: 'StyleHub', industry: 'Fashion', keywords: 'clothing, trends, designer wear' },
      { url: 'https://gaming.example.com', page_title: 'GameZone', industry: 'Gaming', keywords: 'game reviews, esports, gaming gear' },
      { url: 'https://green.example.com', page_title: 'EcoLiving', industry: 'Sustainability', keywords: 'eco-friendly, sustainable living, green products' },
    ];
    for (const s of seoItems) {
      await client.query(
        `INSERT INTO seo_items (url, page_title, industry, keywords) VALUES ($1,$2,$3,$4)`,
        [s.url, s.page_title, s.industry, s.keywords]
      );
    }
    console.log('SEO items seeded');

    // Seed Chat Scripts
    const chatScripts = [
      { title: 'Order Status Inquiry', scenario: 'Customer asks about order status', industry: 'E-commerce', tone: 'Helpful' },
      { title: 'Technical Troubleshooting', scenario: 'User reports software bug', industry: 'SaaS', tone: 'Patient' },
      { title: 'Billing Dispute', scenario: 'Customer disputes a charge', industry: 'Finance', tone: 'Empathetic' },
      { title: 'Product Recommendation', scenario: 'Customer needs product advice', industry: 'Retail', tone: 'Enthusiastic' },
      { title: 'Account Cancellation', scenario: 'User wants to cancel subscription', industry: 'SaaS', tone: 'Retention-focused' },
      { title: 'Shipping Delay', scenario: 'Package delayed notification', industry: 'Logistics', tone: 'Apologetic' },
      { title: 'New Feature Inquiry', scenario: 'User asks about new features', industry: 'Technology', tone: 'Informative' },
      { title: 'Password Reset', scenario: 'User locked out of account', industry: 'General', tone: 'Reassuring' },
      { title: 'Refund Request', scenario: 'Customer wants a refund', industry: 'E-commerce', tone: 'Understanding' },
      { title: 'Onboarding Welcome', scenario: 'New user first interaction', industry: 'SaaS', tone: 'Welcoming' },
      { title: 'Complaint Escalation', scenario: 'Angry customer needs escalation', industry: 'General', tone: 'Calm' },
      { title: 'Upsell Opportunity', scenario: 'Customer eligible for upgrade', industry: 'Telecom', tone: 'Persuasive' },
      { title: 'Appointment Scheduling', scenario: 'Customer books appointment', industry: 'Healthcare', tone: 'Professional' },
      { title: 'Warranty Claim', scenario: 'Product warranty issue', industry: 'Electronics', tone: 'Thorough' },
      { title: 'Feedback Collection', scenario: 'Post-service feedback', industry: 'Hospitality', tone: 'Grateful' },
    ];
    for (const cs of chatScripts) {
      await client.query(
        `INSERT INTO chat_scripts (title, scenario, industry, tone) VALUES ($1,$2,$3,$4)`,
        [cs.title, cs.scenario, cs.industry, cs.tone]
      );
    }
    console.log('Chat scripts seeded');

    // Seed Product Descriptions
    const productDescriptions = [
      { product_name: 'AirPods Pro Max', category: 'Electronics', features: 'Active noise cancellation, spatial audio, 30hr battery', price: 549.99 },
      { product_name: 'Ergonomic Standing Desk', category: 'Furniture', features: 'Electric height adjust, memory presets, cable management', price: 699.99 },
      { product_name: 'Organic Green Tea Set', category: 'Food & Drink', features: 'Matcha grade, ceramic teapot, bamboo whisk', price: 45.99 },
      { product_name: 'Smart Home Hub', category: 'Smart Home', features: 'Voice control, 100+ device support, energy monitoring', price: 129.99 },
      { product_name: 'Leather Laptop Bag', category: 'Accessories', features: 'Full grain leather, padded 15" sleeve, RFID pocket', price: 189.99 },
      { product_name: 'Wireless Charging Pad', category: 'Electronics', features: '15W fast charge, multi-device, LED indicator', price: 39.99 },
      { product_name: 'Yoga Mat Premium', category: 'Fitness', features: 'Non-slip, eco-friendly, 6mm thick, carry strap', price: 59.99 },
      { product_name: 'Mechanical Keyboard', category: 'Computer Peripherals', features: 'Cherry MX switches, RGB, wireless, hot-swap', price: 159.99 },
      { product_name: 'Portable Espresso Maker', category: 'Kitchen', features: 'Battery powered, Nespresso compatible, travel case', price: 89.99 },
      { product_name: 'Smart Water Bottle', category: 'Health', features: 'Temperature display, hydration reminder, UV sterilization', price: 34.99 },
      { product_name: '4K Webcam', category: 'Electronics', features: 'Auto-focus, built-in mic, privacy shutter, ring light', price: 119.99 },
      { product_name: 'Noise-Canceling Earbuds', category: 'Audio', features: 'ANC, transparency mode, 8hr battery, IPX5', price: 199.99 },
      { product_name: 'Sustainable Backpack', category: 'Bags', features: 'Recycled materials, solar panel, anti-theft, waterproof', price: 129.99 },
      { product_name: 'Smart Garden Kit', category: 'Garden', features: 'Auto watering, LED grow lights, app control, 6 pods', price: 99.99 },
      { product_name: 'Desk Lamp Pro', category: 'Lighting', features: 'Adjustable color temp, USB charging, eye-care mode', price: 49.99 },
    ];
    for (const pd of productDescriptions) {
      await client.query(
        `INSERT INTO product_descriptions (product_name, category, features, price) VALUES ($1,$2,$3,$4)`,
        [pd.product_name, pd.category, pd.features, pd.price]
      );
    }
    console.log('Product descriptions seeded');

    // Seed Social Posts
    const socialPosts = [
      { title: 'Product Launch Announcement', platform: 'LinkedIn', topic: 'New SaaS product launch', hashtags: '#launch #saas #innovation' },
      { title: 'Behind the Scenes', platform: 'Instagram', topic: 'Office culture', hashtags: '#teamwork #behindthescenes #startup' },
      { title: 'Tech Tip Tuesday', platform: 'Twitter', topic: 'Productivity hack', hashtags: '#techtip #productivity #lifehack' },
      { title: 'Customer Success Story', platform: 'LinkedIn', topic: 'Case study', hashtags: '#success #testimonial #growth' },
      { title: 'Meme Monday', platform: 'Instagram', topic: 'Developer humor', hashtags: '#devhumor #coding #memes' },
      { title: 'Industry Insights', platform: 'LinkedIn', topic: 'AI industry trends', hashtags: '#AI #trends #future' },
      { title: 'Recipe of the Week', platform: 'TikTok', topic: 'Quick healthy meal', hashtags: '#recipe #healthy #quickmeals' },
      { title: 'Motivational Monday', platform: 'Instagram', topic: 'Entrepreneurship motivation', hashtags: '#motivation #hustle #entrepreneur' },
      { title: 'How-To Guide', platform: 'YouTube', topic: 'Setting up CI/CD', hashtags: '#tutorial #devops #cicd' },
      { title: 'Flash Sale Alert', platform: 'Twitter', topic: '24-hour discount', hashtags: '#sale #deal #limited' },
      { title: 'Team Spotlight', platform: 'LinkedIn', topic: 'Employee highlight', hashtags: '#team #culture #hiring' },
      { title: 'Throwback Thursday', platform: 'Instagram', topic: 'Company milestones', hashtags: '#tbt #milestone #growth' },
      { title: 'Poll/Question', platform: 'Twitter', topic: 'AI vs traditional coding', hashtags: '#poll #tech #debate' },
      { title: 'Event Promotion', platform: 'Facebook', topic: 'Upcoming webinar', hashtags: '#webinar #event #free' },
      { title: 'Year Wrap-Up', platform: 'LinkedIn', topic: 'Annual achievements', hashtags: '#yearinreview #achievements #goals' },
    ];
    for (const sp of socialPosts) {
      await client.query(
        `INSERT INTO social_posts (title, platform, topic, hashtags) VALUES ($1,$2,$3,$4)`,
        [sp.title, sp.platform, sp.topic, sp.hashtags]
      );
    }
    console.log('Social posts seeded');

    // Seed Learning Paths
    const learningPaths = [
      { title: 'Full Stack Web Development', subject: 'Web Development', skill_level: 'Beginner', goal: 'Build production-ready web apps' },
      { title: 'Machine Learning Engineering', subject: 'AI/ML', skill_level: 'Intermediate', goal: 'Deploy ML models in production' },
      { title: 'Cloud Architecture (AWS)', subject: 'Cloud Computing', skill_level: 'Intermediate', goal: 'Pass AWS Solutions Architect exam' },
      { title: 'iOS App Development', subject: 'Mobile Development', skill_level: 'Beginner', goal: 'Publish an app to App Store' },
      { title: 'Cybersecurity Fundamentals', subject: 'Security', skill_level: 'Beginner', goal: 'CompTIA Security+ certification' },
      { title: 'Data Engineering Pipeline', subject: 'Data Engineering', skill_level: 'Advanced', goal: 'Build scalable ETL pipelines' },
      { title: 'UI/UX Design Mastery', subject: 'Design', skill_level: 'Beginner', goal: 'Create professional design portfolios' },
      { title: 'DevOps & CI/CD', subject: 'DevOps', skill_level: 'Intermediate', goal: 'Automate deployment workflows' },
      { title: 'Blockchain Development', subject: 'Web3', skill_level: 'Intermediate', goal: 'Build and deploy smart contracts' },
      { title: 'Natural Language Processing', subject: 'AI/ML', skill_level: 'Advanced', goal: 'Build NLP applications from scratch' },
      { title: 'Product Management', subject: 'Business', skill_level: 'Beginner', goal: 'Lead product development cycles' },
      { title: 'Rust Programming', subject: 'Systems Programming', skill_level: 'Intermediate', goal: 'Build high-performance systems software' },
      { title: 'Digital Marketing Strategy', subject: 'Marketing', skill_level: 'Beginner', goal: 'Run effective digital campaigns' },
      { title: 'Game Development with Unity', subject: 'Game Dev', skill_level: 'Beginner', goal: 'Publish a complete indie game' },
      { title: 'Microservices Architecture', subject: 'Software Architecture', skill_level: 'Advanced', goal: 'Design and implement microservices' },
    ];
    for (const lp of learningPaths) {
      await client.query(
        `INSERT INTO learning_paths (title, subject, skill_level, goal) VALUES ($1,$2,$3,$4)`,
        [lp.title, lp.subject, lp.skill_level, lp.goal]
      );
    }
    console.log('Learning paths seeded');

    console.log('\nAll seed data inserted successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
