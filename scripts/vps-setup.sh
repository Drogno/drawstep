#!/bin/bash

# ============================================
# DRAWSTEP VPS Setup Script
# ============================================
# Automatisches Setup für Netcup VPS 250 G11s
# Ubuntu 22.04 LTS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root"
   exit 1
fi

# Get domain from user
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}       DRAWSTEP VPS Setup Script${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
read -p "Enter your domain name (e.g., example.com): " DOMAIN
read -p "Enter admin password for DRAWSTEP: " ADMIN_PASSWORD
read -s -p "Enter JWT secret (min 32 characters): " JWT_SECRET
echo ""

if [[ -z "$DOMAIN" || -z "$ADMIN_PASSWORD" || -z "$JWT_SECRET" ]]; then
    error "All fields are required!"
    exit 1
fi

if [[ ${#JWT_SECRET} -lt 32 ]]; then
    error "JWT secret must be at least 32 characters long!"
    exit 1
fi

log "Starting DRAWSTEP VPS setup for domain: $DOMAIN"

# ============================================
# SYSTEM UPDATES
# ============================================
log "Updating system packages..."
apt update && apt upgrade -y
success "System updated"

# ============================================
# NODE.JS INSTALLATION
# ============================================
log "Installing Node.js 18.x LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
success "Node.js installed: $(node --version)"

# Install PM2 globally
log "Installing PM2..."
npm install -g pm2
success "PM2 installed"

# ============================================
# NGINX INSTALLATION
# ============================================
log "Installing Nginx..."
apt install nginx -y
success "Nginx installed"

# Configure firewall
log "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
success "Firewall configured"

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
success "Nginx started and enabled"

# ============================================
# USER AND DIRECTORIES SETUP
# ============================================
log "Creating drawstep user and directories..."
adduser --system --group --shell /bin/bash drawstep
mkdir -p /var/www/drawstep/backend
mkdir -p /var/www/drawstep/frontend
chown -R drawstep:drawstep /var/www/drawstep
success "User and directories created"

# ============================================
# NGINX CONFIGURATION
# ============================================
log "Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/drawstep << EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend (statische Dateien)
    location / {
        root /var/www/drawstep/frontend;
        try_files \$uri \$uri/ /index.html;
        
        # Cache für statische Assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Admin Panel
    location /admin {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Admin API
    location /admin/api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable site
ln -sf /etc/nginx/sites-available/drawstep /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t
systemctl restart nginx
success "Nginx configured and restarted"

# ============================================
# SSL CERTIFICATE
# ============================================
log "Installing Certbot for SSL..."
apt install certbot python3-certbot-nginx -y

warning "SSL certificate setup requires manual interaction..."
warning "Please follow the prompts to:"
warning "1. Enter your email address"
warning "2. Accept the terms of service (A)"
warning "3. Choose newsletter preference (Y/N)"
warning "4. Select redirect to HTTPS (2)"

certbot --nginx -d $DOMAIN -d www.$DOMAIN

# Test auto-renewal
certbot renew --dry-run
success "SSL certificate installed and auto-renewal configured"

# ============================================
# ENVIRONMENT FILE
# ============================================
log "Creating environment configuration..."
cat > /var/www/drawstep/backend/.env << EOL
NODE_ENV=production
PORT=3000
ADMIN_PASSWORD=$ADMIN_PASSWORD
JWT_SECRET=$JWT_SECRET
DATABASE_PATH=./database/drawstep.db
EOL

chmod 600 /var/www/drawstep/backend/.env
chown drawstep:drawstep /var/www/drawstep/backend/.env
success "Environment file created"

# ============================================
# PM2 ECOSYSTEM FILE
# ============================================
log "Creating PM2 ecosystem configuration..."
cat > /var/www/drawstep/backend/ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'drawstep-backend',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOL

# Create logs directory
mkdir -p /var/www/drawstep/backend/logs
chown -R drawstep:drawstep /var/www/drawstep/backend
success "PM2 ecosystem configured"

# ============================================
# PM2 STARTUP
# ============================================
log "Configuring PM2 startup..."
sudo -u drawstep bash -c "cd /var/www/drawstep/backend && pm2 startup"
warning "Please run the displayed PM2 startup command manually after this script completes!"

# ============================================
# DEPLOYMENT HELPER SCRIPT
# ============================================
log "Creating deployment helper script..."
cat > /home/drawstep/deploy.sh << 'EOL'
#!/bin/bash
# DRAWSTEP Deployment Helper

cd /var/www/drawstep/backend

echo "Installing/updating dependencies..."
npm install

echo "Restarting PM2 app..."
pm2 restart drawstep-backend

echo "Checking PM2 status..."
pm2 status

echo "Deployment complete!"
echo "Logs: pm2 logs drawstep-backend"
EOL

chmod +x /home/drawstep/deploy.sh
chown drawstep:drawstep /home/drawstep/deploy.sh
success "Deployment helper script created"

# ============================================
# SETUP COMPLETE
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}         SETUP COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload your DRAWSTEP files to:"
echo "   - Backend: /var/www/drawstep/backend/"
echo "   - Frontend: /var/www/drawstep/frontend/"
echo ""
echo "2. As drawstep user, install dependencies and start the app:"
echo "   sudo su - drawstep"
echo "   cd /var/www/drawstep/backend"
echo "   npm install"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo ""
echo "3. Test your installation:"
echo "   - Website: https://$DOMAIN"
echo "   - Admin Panel: https://$DOMAIN/admin"
echo "   - API Health: https://$DOMAIN/api/health"
echo ""
echo -e "${BLUE}Admin Login Details:${NC}"
echo "   URL: https://$DOMAIN/admin"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "   - Check PM2 status: sudo su - drawstep -c 'pm2 status'"
echo "   - View logs: sudo su - drawstep -c 'pm2 logs drawstep-backend'"
echo "   - Restart app: sudo su - drawstep -c 'pm2 restart drawstep-backend'"
echo "   - Deploy updates: sudo su - drawstep -c './deploy.sh'"
echo ""
warning "Don't forget to:"
warning "1. Update your domain's DNS A-records to point to this VPS IP"
warning "2. Upload your DRAWSTEP application files"
warning "3. Run the PM2 startup command displayed above"
echo ""
success "DRAWSTEP VPS setup completed successfully!"