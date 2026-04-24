#!/bin/bash

# AI Marketplace Builder Platform - Start Script
# This script cleans ports, sets up the database, seeds data, and starts both servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║       AI Marketplace Builder Platform                ║"
echo "║       Starting Application...                        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load env vars
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# ============ CLEAN PORTS ============
echo -e "\n${BLUE}▸ Cleaning ports ${BACKEND_PORT} and ${FRONTEND_PORT}...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${CYAN}  Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT
echo -e "${GREEN}✓ Ports cleaned${NC}"

# ============ INSTALL DEPENDENCIES ============
echo -e "\n${BLUE}▸ Installing server dependencies...${NC}"
cd server
npm install --silent 2>/dev/null
echo -e "${GREEN}✓ Server dependencies installed${NC}"

echo -e "\n${BLUE}▸ Installing client dependencies...${NC}"
cd ../client
npm install --silent 2>/dev/null
echo -e "${GREEN}✓ Client dependencies installed${NC}"
cd ..

# ============ DATABASE SETUP ============
echo -e "\n${BLUE}▸ Setting up database...${NC}"

# Create database if not exists
psql -U $(whoami) -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'ai_marketplace'" | grep -q 1 || \
  psql -U $(whoami) -d postgres -c "CREATE DATABASE ai_marketplace"
echo -e "${GREEN}✓ Database ready${NC}"

# Drop existing tables and reseed
echo -e "${BLUE}▸ Clearing and seeding database...${NC}"
psql -U $(whoami) -d ai_marketplace -c "
  DROP TABLE IF EXISTS users CASCADE;
  DROP TABLE IF EXISTS trip_plans CASCADE;
  DROP TABLE IF EXISTS content_items CASCADE;
  DROP TABLE IF EXISTS code_snippets CASCADE;
  DROP TABLE IF EXISTS image_prompts CASCADE;
  DROP TABLE IF EXISTS business_plans CASCADE;
  DROP TABLE IF EXISTS email_templates CASCADE;
  DROP TABLE IF EXISTS recipes CASCADE;
  DROP TABLE IF EXISTS resumes CASCADE;
  DROP TABLE IF EXISTS marketing_copies CASCADE;
  DROP TABLE IF EXISTS stories CASCADE;
  DROP TABLE IF EXISTS translations CASCADE;
  DROP TABLE IF EXISTS seo_items CASCADE;
  DROP TABLE IF EXISTS chat_scripts CASCADE;
  DROP TABLE IF EXISTS product_descriptions CASCADE;
  DROP TABLE IF EXISTS social_posts CASCADE;
  DROP TABLE IF EXISTS learning_paths CASCADE;
" > /dev/null 2>&1

cd server
node seed.js
cd ..
echo -e "${GREEN}✓ Database seeded with sample data${NC}"

# ============ START SERVERS ============
echo -e "\n${PURPLE}▸ Starting servers with hot reload...${NC}"
echo -e "${CYAN}  Backend:  http://localhost:${BACKEND_PORT}${NC}"
echo -e "${CYAN}  Frontend: http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${CYAN}  Login:    admin@aimarket.com / password123${NC}"
echo ""

# Trap to cleanup on exit
cleanup() {
  echo -e "\n${RED}Shutting down...${NC}"
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend with nodemon (watches for changes)
cd server
npx nodemon index.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend (React dev server watches for changes automatically)
cd client
PORT=$FRONTEND_PORT BROWSER=none npm start &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Both servers running with hot reload!${NC}"
echo -e "${GREEN}  Press Ctrl+C to stop${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
