# DRAWSTEP Status - 2025-08-28

## Aktueller Stand
- ✅ Backend-Server läuft korrekt auf VPS (PM2)
- ✅ Admin-Login funktioniert lokal auf VPS
- ❌ Domain drawstep.de zeigt auf Apache statt nginx
- ❌ Browser Admin-Login funktioniert nicht (404 Error)

## Das Problem
Die Domain `drawstep.de` wird durch Netcup CDN/Proxy geleitet und zeigt Apache-Seiten statt nginx. 

**Funktioniert:**
```bash
curl -X POST http://localhost:3000/admin/api/login -H "Content-Type: application/json" -d '{"password":"drawstep2024"}'
# Antwort: {"success":true,"token":"drawstep2024","message":"Login successful"}
```

**Funktioniert NICHT:**
```bash
curl -X POST http://drawstep.de/admin/api/login -H "Content-Type: application/json" -d '{"password":"drawstep2024"}'
# Antwort: Apache 404 HTML-Seite
```

## VPS Details
- IP: 152.53.191.111
- User: root
- Node.js Server: läuft auf Port 3000 via PM2
- nginx: läuft auf Port 80, korrekt konfiguriert
- DNS: zeigt korrekt auf VPS IP

## Nächste Schritte
1. **Bei Netcup einloggen** und Domain-Einstellungen prüfen:
   - CDN/Proxy deaktivieren
   - Direkte DNS-Weiterleitung ohne Proxy
   - A-Records prüfen: @ -> 152.53.191.111

2. **Alternative Tests:**
   ```bash
   # Direkt mit IP testen
   curl -X POST http://152.53.191.111/admin/api/login -H "Content-Type: application/json" -d '{"password":"drawstep2024"}'
   
   # Browser: http://152.53.191.111/admin
   ```

## SSH-Verbindung
```bash
ssh root@152.53.191.111
cd /var/www/drawstep/backend
pm2 status  # Server-Status prüfen
```

## Browser-Test
- URL: https://drawstep.de/admin
- Passwort: drawstep2024
- Aktueller Fehler: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
- Konsole zeigt: POST https://drawstep.de/admin/api/login 404 (Not Found)

## Debugging-Commands
```bash
# Auf VPS
systemctl status nginx
nginx -t
pm2 logs drawstep-backend --lines 10
cat /etc/nginx/sites-available/drawstep

# DNS-Test
nslookup drawstep.de
# Zeigt: 152.53.191.111 (korrekt)
```