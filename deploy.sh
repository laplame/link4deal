#!/bin/bash

# Link4Deal Deployment Script
# This script kills existing processes and restarts everything with correct configuration

echo "🚀 Starting Link4Deal deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project paths
PROJECT_DIR="/home/cto/project"
LOG_DIR="$PROJECT_DIR/logs"

echo -e "${YELLOW}📁 Working directory: $PROJECT_DIR${NC}"

# Create logs directory if it doesn't exist
echo "📂 Creating logs directory..."
sudo mkdir -p $LOG_DIR
sudo chown -R cto:cto $LOG_DIR

# Step 1: Kill existing processes
echo -e "${YELLOW}🔥 Killing existing processes...${NC}"

# Kill PM2 processes
echo "Stopping PM2 processes..."
pm2 stop all || echo "No PM2 processes to stop"
pm2 delete all || echo "No PM2 processes to delete"

# Kill any processes on port 5001 (backend API)
echo "Killing processes on port 5001..."
sudo fuser -k 5001/tcp || echo "No processes on port 5001"

# Kill any processes on port 5173 (development server)
echo "Killing processes on port 5173..."
sudo fuser -k 5173/tcp || echo "No processes on port 5173"

# Kill any nginx processes (we'll restart it properly)
echo "Stopping nginx..."
sudo systemctl stop nginx || echo "Nginx already stopped"

# Step 2: Copy configuration files
echo -e "${YELLOW}📋 Updating configuration files...${NC}"

# Copy nginx configuration
echo "Updating nginx configuration..."
sudo cp $PROJECT_DIR/nginx.conf /etc/nginx/sites-available/link4deal || echo "Could not copy nginx.conf"
sudo cp $PROJECT_DIR/nginx-5173.conf /etc/nginx/sites-available/link4deal-dev || echo "Could not copy nginx-5173.conf"

# Enable sites
sudo ln -sf /etc/nginx/sites-available/link4deal /etc/nginx/sites-enabled/ || echo "Could not enable main site"
sudo ln -sf /etc/nginx/sites-available/link4deal-dev /etc/nginx/sites-enabled/ || echo "Could not enable dev site"

# Remove default nginx site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Step 3: Test nginx configuration
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    exit 1
fi

# Step 4: Build the frontend
echo -e "${YELLOW}🏗️ Building frontend...${NC}"
cd $PROJECT_DIR
if [ -f "package.json" ]; then
    npm install || { echo -e "${RED}❌ npm install failed${NC}"; exit 1; }
    npm run build || { echo -e "${RED}❌ Frontend build failed${NC}"; exit 1; }
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${YELLOW}⚠️ No package.json found, skipping frontend build${NC}"
fi

# Step 5: Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd $PROJECT_DIR/server
if [ -f "package.json" ]; then
    npm install || { echo -e "${RED}❌ Backend npm install failed${NC}"; exit 1; }
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️ No package.json found in server directory${NC}"
fi

# Step 6: Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"

# Start nginx
echo "Starting nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start nginx${NC}"
    sudo systemctl status nginx
    exit 1
fi

# Start PM2 processes
echo "Starting backend with PM2..."
cd $PROJECT_DIR
pm2 start ecosystem.config.js --env production

# Step 7: Verify everything is running
echo -e "${YELLOW}🔍 Verifying services...${NC}"

# Check nginx status
if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is not running${NC}"
fi

# Check PM2 processes
pm2 list

# Check ports
echo "Checking ports..."
echo "Port 80 (nginx):"
sudo lsof -i :80 || echo "No process on port 80"
echo "Port 5001 (backend API):"
sudo lsof -i :5001 || echo "No process on port 5001"
echo "Port 5173 (dev server):"
sudo lsof -i :5173 || echo "No process on port 5173"

# Test endpoints
echo -e "${YELLOW}🧪 Testing endpoints...${NC}"
echo "Testing main site (port 80):"
curl -s -o /dev/null -w "%{http_code}" http://localhost/ && echo " - Main site responding" || echo " - Main site not responding"

echo "Testing dev site (port 5173):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ && echo " - Dev site responding" || echo " - Dev site not responding"

echo "Testing API health (port 5001):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health && echo " - API health responding" || echo " - API health not responding"

echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo "Access your application at:"
echo "🌐 Production: http://damecodigo.com (port 80)"
echo "🛠️ Development: http://damecodigo.com:5173 (port 5173)"
echo "📡 API: http://damecodigo.com/api (proxied to port 5001)"
echo ""
echo "To monitor logs:"
echo "pm2 logs link4deal-backend"
echo "sudo tail -f /var/log/nginx/error.log"
