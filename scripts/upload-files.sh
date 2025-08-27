#!/bin/bash

# ============================================
# DRAWSTEP File Upload Script
# ============================================
# Upload local files to VPS via SCP

# Configuration
VPS_IP=""
VPS_USER="root"
DOMAIN=""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

# Get configuration from user
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}       DRAWSTEP File Upload Script${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

if [[ -z "$VPS_IP" ]]; then
    read -p "Enter your VPS IP address: " VPS_IP
fi

if [[ -z "$DOMAIN" ]]; then
    read -p "Enter your domain name: " DOMAIN
fi

if [[ -z "$VPS_IP" || -z "$DOMAIN" ]]; then
    error "VPS IP and domain are required!"
    exit 1
fi

log "Starting file upload to $VPS_IP..."

# Test SSH connection
log "Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes $VPS_USER@$VPS_IP exit; then
    error "Cannot connect to VPS. Please check:"
    echo "  1. VPS IP address is correct"
    echo "  2. SSH service is running"
    echo "  3. Root login is enabled"
    echo "  4. Firewall allows SSH (port 22)"
    exit 1
fi
success "SSH connection successful"

# Create directories on VPS
log "Creating directories on VPS..."
ssh $VPS_USER@$VPS_IP "mkdir -p /var/www/drawstep/backend /var/www/drawstep/frontend"
success "Directories created"

# Upload backend files
log "Uploading backend files..."

# Core backend files
scp server.js $VPS_USER@$VPS_IP:/var/www/drawstep/backend/
scp package.json $VPS_USER@$VPS_IP:/var/www/drawstep/backend/
scp package-lock.json $VPS_USER@$VPS_IP:/var/www/drawstep/backend/

# Routes directory
scp -r routes/ $VPS_USER@$VPS_IP:/var/www/drawstep/backend/

# Database directory
scp -r database/ $VPS_USER@$VPS_IP:/var/www/drawstep/backend/

# Admin panel
scp -r admin/ $VPS_USER@$VPS_IP:/var/www/drawstep/backend/

# Tools directory (contains metadecks.json)
scp -r tools/ $VPS_USER@$VPS_IP:/var/www/drawstep/backend/

success "Backend files uploaded"

# Upload frontend files
log "Uploading frontend files..."

# Main HTML files
scp index.html $VPS_USER@$VPS_IP:/var/www/drawstep/frontend/
scp contact.html $VPS_USER@$VPS_IP:/var/www/drawstep/frontend/
scp datenschutz.html $VPS_USER@$VPS_IP:/var/www/drawstep/frontend/
scp impressum.html $VPS_USER@$VPS_IP:/var/www/drawstep/frontend/

# Assets directory
scp -r assets/ $VPS_USER@$VPS_IP:/var/www/drawstep/frontend/

# Tools directory for frontend
scp -r tools/ $VPS_USER@$VPS_IP:/var/www/drawstep/frontend/

success "Frontend files uploaded"

# Set correct permissions
log "Setting file permissions..."
ssh $VPS_USER@$VPS_IP "chown -R drawstep:drawstep /var/www/drawstep"
ssh $VPS_USER@$VPS_IP "chmod -R 755 /var/www/drawstep/frontend"
ssh $VPS_USER@$VPS_IP "chmod -R 750 /var/www/drawstep/backend"
ssh $VPS_USER@$VPS_IP "chmod 600 /var/www/drawstep/backend/.env 2>/dev/null || true"
success "Permissions set"

# Install dependencies and start application
log "Installing dependencies on VPS..."
ssh $VPS_USER@$VPS_IP "cd /var/www/drawstep/backend && sudo -u drawstep npm install"
success "Dependencies installed"

# Start PM2 application
log "Starting application with PM2..."
ssh $VPS_USER@$VPS_IP "cd /var/www/drawstep/backend && sudo -u drawstep pm2 start ecosystem.config.js"
ssh $VPS_USER@$VPS_IP "sudo -u drawstep pm2 save"
success "Application started"

# Show final status
log "Checking application status..."
ssh $VPS_USER@$VPS_IP "sudo -u drawstep pm2 status"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}         UPLOAD COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Your DRAWSTEP application is now running:${NC}"
echo "  🌐 Website: https://$DOMAIN"
echo "  🔧 Admin Panel: https://$DOMAIN/admin"
echo "  🏥 API Health: https://$DOMAIN/api/health"
echo ""
echo -e "${YELLOW}To update files in the future:${NC}"
echo "  1. Run this script again to upload changes"
echo "  2. Or use: ssh $VPS_USER@$VPS_IP 'sudo su - drawstep -c \"./deploy.sh\"'"
echo ""
success "DRAWSTEP deployment completed successfully!"