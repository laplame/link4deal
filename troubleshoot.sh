#!/bin/bash

# Link4Deal Troubleshooting Script
# Quick diagnosis of nginx 502 Bad Gateway issues

echo "🔍 Link4Deal Troubleshooting Script"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check nginx status
echo -e "\n${YELLOW}1. Checking Nginx Status:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is NOT running${NC}"
    echo "Try: sudo systemctl start nginx"
fi

# Check nginx configuration
echo -e "\n${YELLOW}2. Testing Nginx Configuration:${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
fi

# Check ports
echo -e "\n${YELLOW}3. Checking Port Usage:${NC}"
echo "Port 80 (nginx main):"
if lsof -i :80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Something is listening on port 80${NC}"
    lsof -i :80
else
    echo -e "${RED}❌ Nothing listening on port 80${NC}"
fi

echo -e "\nPort 5001 (backend API):"
if lsof -i :5001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is running on port 5001${NC}"
    lsof -i :5001
else
    echo -e "${RED}❌ Backend API is NOT running on port 5001${NC}"
    echo "This is likely the cause of the 502 error!"
fi

echo -e "\nPort 5173 (dev server):"
if lsof -i :5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dev server is listening on port 5173${NC}"
    lsof -i :5173
else
    echo -e "${YELLOW}⚠️ No dev server on port 5173${NC}"
fi

# Check PM2 processes
echo -e "\n${YELLOW}4. Checking PM2 Processes:${NC}"
if command -v pm2 > /dev/null 2>&1; then
    pm2 list
    if pm2 list | grep -q "link4deal-backend"; then
        echo -e "${GREEN}✅ Link4Deal backend process found${NC}"
    else
        echo -e "${RED}❌ Link4Deal backend process NOT found${NC}"
        echo "Try: pm2 start ecosystem.config.js --env production"
    fi
else
    echo -e "${RED}❌ PM2 is not installed${NC}"
fi

# Check file permissions and paths
echo -e "\n${YELLOW}5. Checking File Paths:${NC}"
PROJECT_DIR="/home/cto/project"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${GREEN}✅ Project directory exists: $PROJECT_DIR${NC}"
    
    if [ -d "$PROJECT_DIR/front_mongo/dist" ]; then
        echo -e "${GREEN}✅ Frontend dist directory exists${NC}"
    else
        echo -e "${RED}❌ Frontend dist directory NOT found${NC}"
        echo "Try: npm run build in the project directory"
    fi
    
    if [ -f "$PROJECT_DIR/server/index.js" ]; then
        echo -e "${GREEN}✅ Backend server file exists${NC}"
    else
        echo -e "${RED}❌ Backend server file NOT found${NC}"
        ls -la "$PROJECT_DIR/server/" 2>/dev/null || echo "Server directory not found"
    fi
else
    echo -e "${RED}❌ Project directory NOT found: $PROJECT_DIR${NC}"
fi

# Check nginx error logs
echo -e "\n${YELLOW}6. Recent Nginx Errors:${NC}"
if [ -f "/var/log/nginx/error.log" ]; then
    echo "Last 10 nginx error log entries:"
    sudo tail -n 10 /var/log/nginx/error.log | grep -E "(error|502|upstream)" || echo "No recent relevant errors"
else
    echo "Nginx error log not found"
fi

# Test connectivity
echo -e "\n${YELLOW}7. Testing Connectivity:${NC}"
echo "Testing localhost:5001 (backend API):"
if curl -s --max-time 5 http://localhost:5001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API is responding${NC}"
else
    echo -e "${RED}❌ Backend API is NOT responding${NC}"
    echo "This confirms the 502 error cause - backend is down"
fi

echo -e "\n${YELLOW}8. Quick Fix Suggestions:${NC}"
echo "If backend API (port 5001) is not running:"
echo "1. cd /home/cto/project"
echo "2. pm2 start ecosystem.config.js --env production"
echo "3. pm2 save"
echo ""
echo "If nginx has config errors:"
echo "1. sudo nginx -t (to see specific errors)"
echo "2. Fix the configuration file"
echo "3. sudo systemctl reload nginx"
echo ""
echo "To see live logs:"
echo "- pm2 logs link4deal-backend"
echo "- sudo tail -f /var/log/nginx/error.log"
