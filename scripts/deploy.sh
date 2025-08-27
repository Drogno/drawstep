#!/bin/bash

# ============================================
# DRAWSTEP Deployment Script
# ============================================
# Quick deployment script for updates

set -e

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

# Check if running as drawstep user
if [[ "$(whoami)" != "drawstep" ]]; then
   error "This script must be run as drawstep user"
   echo "Run: sudo su - drawstep"
   exit 1
fi

log "Starting DRAWSTEP deployment..."

# Navigate to backend directory
cd /var/www/drawstep/backend

# Backup current state
log "Creating backup..."
pm2 save
success "PM2 processes saved"

# Install/update dependencies
log "Installing dependencies..."
npm install
success "Dependencies updated"

# Run database migrations if needed
if [ -f "database/migrations.js" ]; then
    log "Running database migrations..."
    node database/migrations.js
    success "Database migrations completed"
fi

# Restart the application
log "Restarting application..."
pm2 restart drawstep-backend
success "Application restarted"

# Wait for app to start
log "Waiting for application to start..."
sleep 3

# Health check
log "Performing health check..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    success "Health check passed"
else
    error "Health check failed!"
    echo "Checking PM2 logs..."
    pm2 logs drawstep-backend --lines 20
    exit 1
fi

# Show status
log "Current PM2 status:"
pm2 status

success "Deployment completed successfully!"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs: pm2 logs drawstep-backend"
echo "  Monitor:   pm2 monit"
echo "  Restart:   pm2 restart drawstep-backend"
echo "  Stop:      pm2 stop drawstep-backend"