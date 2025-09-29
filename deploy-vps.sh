#!/bin/bash

# VPS Deployment Script for Lorcana Mulligan Trainer
# Usage: ./deploy-vps.sh

set -e

echo "🚀 Starting VPS deployment..."

# Configuration
VPS_HOST="your-server-ip"
VPS_USER="root"
VPS_PATH="/var/www/lorcana-mulligan-trainer"
APP_NAME="lorcana-mulligan-trainer"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📦 Building production bundle...${NC}"
npm run build

echo -e "${YELLOW}📋 Creating deployment package...${NC}"
# Create temporary deployment directory
mkdir -p dist-deploy
cp -r .next dist-deploy/
cp -r public dist-deploy/
cp package*.json dist-deploy/
cp ecosystem.config.js dist-deploy/
cp next.config.js dist-deploy/ 2>/dev/null || echo "No next.config.js found"

echo -e "${YELLOW}📤 Uploading to VPS...${NC}"
rsync -avz --delete --exclude 'node_modules' dist-deploy/ $VPS_USER@$VPS_HOST:$VPS_PATH/

echo -e "${YELLOW}🔧 Installing dependencies on VPS...${NC}"
ssh $VPS_USER@$VPS_HOST << EOF
cd $VPS_PATH
npm ci --production
EOF

echo -e "${YELLOW}♻️  Restarting application...${NC}"
ssh $VPS_USER@$VPS_HOST << EOF
pm2 reload $APP_NAME || pm2 start ecosystem.config.js
pm2 save
EOF

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application should be running at: http://$VPS_HOST:3000${NC}"

# Cleanup
rm -rf dist-deploy

echo -e "${YELLOW}📊 PM2 Status:${NC}"
ssh $VPS_USER@$VPS_HOST "pm2 status"