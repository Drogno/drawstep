# 🚀 Netcup VPS 250 G11s Setup Guide
**DRAWSTEP Backend Migration - Complete Step-by-Step Guide**

## 📋 Voraussetzungen
- Netcup VPS 250 G11s bestellt (Ubuntu 22.04 LTS)
- SSH-Zugang (Root-Passwort oder SSH-Key)
- Domain/Subdomain für Admin-Panel

## 🎯 Ziel
- Node.js Backend auf VPS
- Nginx Reverse Proxy
- SSL-Verschlüsselung
- PM2 Process Management
- DRAWSTEP Admin-Panel unter `https://deine-domain.de/admin`

---

## 1️⃣ Erste Verbindung zum VPS

### SSH-Verbindung herstellen
```bash
# SSH-Verbindung (IP-Adresse aus Netcup Panel)
ssh root@DEINE_VPS_IP

# Bei erster Verbindung "yes" bestätigen
# Root-Passwort eingeben
```

### System aktualisieren
```bash
# System-Updates installieren
apt update && apt upgrade -y

# Reboot nach Updates (falls nötig)
reboot
```

---

## 2️⃣ Node.js Installation

### Node.js 18.x LTS installieren
```bash
# NodeSource Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js installieren
apt-get install -y nodejs

# Version prüfen
node --version  # sollte v18.x.x zeigen
npm --version   # sollte 9.x.x zeigen
```

### PM2 Global installieren
```bash
# PM2 für Process Management
npm install -g pm2

# PM2 Startup konfigurieren
pm2 startup
# Den angezeigten Befehl ausführen (wird angezeigt)
```

---

## 3️⃣ Nginx Installation & Konfiguration

### Nginx installieren
```bash
# Nginx Web Server
apt install nginx -y

# Firewall konfigurieren
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Nginx starten und aktivieren
systemctl start nginx
systemctl enable nginx
```

### Nginx Reverse Proxy konfigurieren
```bash
# Site-Konfiguration erstellen
nano /etc/nginx/sites-available/drawstep
```

**Inhalt der Datei `/etc/nginx/sites-available/drawstep`:**
```nginx
server {
    listen 80;
    server_name deine-domain.de www.deine-domain.de;

    # Frontend (statische Dateien)
    location / {
        root /var/www/drawstep/frontend;
        try_files $uri $uri/ /index.html;
        
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin Panel
    location /admin {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin API
    location /admin/api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Site aktivieren
```bash
# Symbolischen Link erstellen
ln -s /etc/nginx/sites-available/drawstep /etc/nginx/sites-enabled/

# Default Site deaktivieren
rm /etc/nginx/sites-enabled/default

# Nginx Konfiguration testen
nginx -t

# Nginx neustarten
systemctl restart nginx
```

---

## 4️⃣ SSL-Zertifikat (Let's Encrypt)

### Certbot installieren
```bash
# Certbot für Let's Encrypt
apt install certbot python3-certbot-nginx -y
```

### SSL-Zertifikat erstellen
```bash
# Zertifikat für deine Domain
certbot --nginx -d deine-domain.de -d www.deine-domain.de

# Folge den Anweisungen:
# 1. Email-Adresse eingeben
# 2. Terms of Service akzeptieren (A)
# 3. Newsletter optional (Y/N)
# 4. Redirect to HTTPS wählen (2)
```

### Auto-Renewal testen
```bash
# Test ob automatische Erneuerung funktioniert
certbot renew --dry-run
```

---

## 5️⃣ DRAWSTEP Backend Deployment

### Verzeichnisstruktur erstellen
```bash
# App-Verzeichnisse erstellen
mkdir -p /var/www/drawstep/backend
mkdir -p /var/www/drawstep/frontend

# Benutzer für App erstellen
adduser --system --group --shell /bin/bash drawstep
chown -R drawstep:drawstep /var/www/drawstep
```

### Backend-Code hochladen

**Option A: Git Clone (empfohlen)**
```bash
# In Backend-Verzeichnis wechseln
cd /var/www/drawstep/backend

# Repository klonen (falls auf GitHub)
# git clone https://github.com/dein-username/drawstep.git .

# ODER: Files manuell hochladen (siehe Option B)
```

**Option B: Manueller Upload**
```bash
# Via SCP/SFTP folgende Dateien hochladen nach /var/www/drawstep/backend/:
# - server.js
# - package.json
# - package-lock.json
# - routes/ (kompletter Ordner)
# - database/ (kompletter Ordner)
# - admin/ (kompletter Ordner)
# - tools/ (kompletter Ordner)
# - .env (siehe unten)
```

### Environment-Variablen konfigurieren
```bash
# .env Datei erstellen
nano /var/www/drawstep/backend/.env
```

**Inhalt der `.env` Datei:**
```env
NODE_ENV=production
PORT=3000
ADMIN_PASSWORD=DeinSicheresAdminPasswort123!
JWT_SECRET=DeinSuperGeheimesJWTSecret2024!
DATABASE_PATH=./database/drawstep.db
```

### Dependencies installieren
```bash
# Als drawstep user wechseln
su - drawstep
cd /var/www/drawstep/backend

# Node Modules installieren
npm install

# Zurück zu root
exit
```

---

## 6️⃣ Frontend-Files hochladen

### Statische Frontend-Files
```bash
# Frontend-Files nach /var/www/drawstep/frontend/ hochladen:
# - index.html
# - contact.html
# - datenschutz.html
# - impressum.html
# - assets/ (kompletter Ordner)
# - tools/lorcana-mulligan/ (kompletter Ordner)
```

### Berechtigungen setzen
```bash
# Korrekte Berechtigungen
chown -R drawstep:drawstep /var/www/drawstep
chmod -R 755 /var/www/drawstep/frontend
chmod -R 750 /var/www/drawstep/backend
chmod 600 /var/www/drawstep/backend/.env
```

---

## 7️⃣ PM2 Konfiguration

### App mit PM2 starten
```bash
# Als drawstep user
su - drawstep
cd /var/www/drawstep/backend

# PM2 Ecosystem File erstellen
nano ecosystem.config.js
```

**Inhalt der `ecosystem.config.js`:**
```javascript
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
```

### App starten
```bash
# Log-Verzeichnis erstellen
mkdir -p logs

# App mit PM2 starten
pm2 start ecosystem.config.js

# PM2 Status prüfen
pm2 status

# Logs anzeigen
pm2 logs drawstep-backend

# Als root: PM2 für Auto-Start konfigurieren
exit  # zurück zu root
pm2 startup
pm2 save
```

---

## 8️⃣ DNS-Konfiguration

### Domain zu VPS zeigen lassen
1. **Bei deinem Domain-Provider** (z.B. Netcup Domain-Panel):
   - A-Record: `deine-domain.de` → `DEINE_VPS_IP`
   - A-Record: `www.deine-domain.de` → `DEINE_VPS_IP`

2. **DNS-Propagation prüfen:**
   ```bash
   # DNS-Auflösung testen
   nslookup deine-domain.de
   dig deine-domain.de
   ```

---

## 9️⃣ Testing & Debugging

### Services testen
```bash
# Nginx Status
systemctl status nginx

# PM2 Status
su - drawstep -c "pm2 status"

# Backend Health Check
curl http://localhost:3000/api/health

# Frontend testen
curl http://localhost/

# SSL testen
curl https://deine-domain.de/api/health
```

### Logs prüfen
```bash
# Nginx Logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# PM2 App Logs
su - drawstep -c "pm2 logs drawstep-backend"

# System Logs
journalctl -u nginx -f
```

### Troubleshooting häufige Probleme
```bash
# Port 3000 prüfen
netstat -tlnp | grep :3000

# Firewall Status
ufw status

# Nginx Konfiguration testen
nginx -t

# PM2 Prozesse neu starten
su - drawstep -c "pm2 restart drawstep-backend"
```

---

## 🎉 Fertig!

### Zugriff testen:
- **Website:** `https://deine-domain.de`
- **Admin Panel:** `https://deine-domain.de/admin`
- **API Health:** `https://deine-domain.de/api/health`

### Admin Login:
- **URL:** `https://deine-domain.de/admin`
- **Passwort:** `DeinSicheresAdminPasswort123!` (aus .env)

---

## 🔧 Wartung & Updates

### Backend Updates
```bash
su - drawstep
cd /var/www/drawstep/backend

# Code aktualisieren (Git)
git pull

# Dependencies aktualisieren
npm install

# App neustarten
pm2 restart drawstep-backend
exit
```

### System Updates
```bash
# Monatliche System-Updates
apt update && apt upgrade -y

# SSL-Zertifikat erneuern (automatisch)
certbot renew
```

### Monitoring
```bash
# PM2 Monitoring
su - drawstep -c "pm2 monit"

# System Resources
htop
df -h
free -h
```

---

## 🆘 Support & Kontakt

Bei Problemen:
1. **Logs prüfen** (siehe Debugging-Sektion)
2. **Nginx/PM2 neu starten**
3. **Firewall-Einstellungen prüfen**
4. **DNS-Propagation abwarten** (bis zu 24h)

**Wichtige Dateien:**
- Nginx Config: `/etc/nginx/sites-available/drawstep`
- PM2 Config: `/var/www/drawstep/backend/ecosystem.config.js`
- Environment: `/var/www/drawstep/backend/.env`
- SSL Certs: `/etc/letsencrypt/live/deine-domain.de/`