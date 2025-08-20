# DRAWSTEP - Deployment Anweisungen

## 📋 Pre-Deployment Checklist

### 1. Kartenbilder vorbereiten
- [ ] **~2000 Kartenbilder** in WebP-Format konvertieren
- [ ] Bilder nach Schema `XXX-YYY.webp` umbenennen
- [ ] Alle Bilder in `/tools/lorcana-mulligan/assets/images/cards/` hochladen
- [ ] **Geschätzte Größe**: ~100-150MB

### 2. Pfade überprüfen
- [ ] Alle Links in der Navigation testen
- [ ] Asset-Pfade validieren
- [ ] JavaScript-Imports prüfen

### 3. Performance-Optimierung
- [ ] WebP-Bilder komprimieren (falls nötig)
- [ ] Gzip-Kompression aktivieren
- [ ] Cache-Headers setzen

## 🚀 Deployment Schritte

### Schritt 1: Server vorbereiten
```bash
# Alle Dateien aus NEW_SERVER_STRUCTURE/ hochladen
# Ordnerstruktur sollte so aussehen:
/var/www/html/
├── index.html
├── assets/
├── tools/
├── .htaccess
├── robots.txt
└── docs/
```

### Schritt 2: Apache konfigurieren
```apache
# In der Apache-Konfiguration oder .htaccess aktivieren:
- mod_rewrite (für saubere URLs)
- mod_deflate (für Kompression)  
- mod_expires (für Caching)
```

### Schritt 3: Kartenbilder hochladen
```bash
# Kartenbilder in den korrekten Ordner:
/var/www/html/tools/lorcana-mulligan/assets/images/cards/
├── 001-001.webp
├── 001-002.webp
├── 001-003.webp
└── ... (~2000 Bilder)
```

### Schritt 4: URLs testen
- [ ] Hauptseite: `https://your-domain.com/`
- [ ] Mulligan Trainer: `https://your-domain.com/tools/lorcana-mulligan/`
- [ ] Navigation zwischen Seiten
- [ ] Kartenbilder laden korrekt

## 🔧 Nach dem Deployment

### 1. SEO einrichten
- [ ] `robots.txt` mit korrekter Domain aktualisieren
- [ ] `sitemap.xml` generieren und einreichen
- [ ] Google Search Console konfigurieren

### 2. Monitoring einrichten
- [ ] Server-Logs überprüfen
- [ ] Broken Links finden
- [ ] Performance messen

### 3. Backup einrichten
- [ ] Automatische Backups konfigurieren
- [ ] Besonders wichtig: Kartenbilder (100-150MB)

## 📊 URL-Struktur nach Deployment

### Alte URLs → Neue URLs (automatische Weiterleitung)
- `drawstep.html` → `/`
- `Mulli/mulli.html` → `/tools/lorcana-mulligan/`

### Neue saubere URLs
- Hauptseite: `https://your-domain.com/`
- Lorcana Trainer: `https://your-domain.com/tools/lorcana-mulligan/`
- Kartenbilder: `https://your-domain.com/tools/lorcana-mulligan/assets/images/cards/001-001.webp`

## ⚠️ Wichtige Hinweise

### Kartenbilder
- **Größe**: ~2000 Dateien à ~50KB = ~100MB
- **Format**: Ausschließlich WebP für beste Performance
- **Lazy Loading**: Bereits implementiert in JavaScript
- **Caching**: 1 Monat via .htaccess

### Performance
- **Erste Seite**: ~2-3MB (HTML + CSS + JS + Logo)
- **Mulligan Tool**: +~200KB pro gezogener Hand (7 Kartenbilder)
- **Gesamte Kartensammlung**: ~100MB (lädt nur bei Bedarf)

### Browser-Kompatibilität
- **WebP**: Unterstützt in allen modernen Browsern
- **Fallback**: PNG-Versionen falls nötig (optional)

## 🆘 Troubleshooting

### Problem: Kartenbilder laden nicht
1. Pfad in `cardImageMap.js` prüfen
2. Dateiberechtigungen überprüfen (755 für Ordner, 644 für Dateien)
3. .htaccess-Regeln validieren

### Problem: Saubere URLs funktionieren nicht
1. mod_rewrite aktiviert?
2. .htaccess wird gelesen?
3. Apache neu starten

### Problem: Seite lädt langsam
1. Gzip-Kompression aktiv?
2. Cache-Headers gesetzt?
3. Kartenbilder zu groß? (WebP-Kompression prüfen)