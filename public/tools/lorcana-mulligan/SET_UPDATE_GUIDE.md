# Lorcana Mulligan Trainer - Set Update Guide

## Übersicht
Dieser Guide erklärt, wie neue Lorcana Sets in den Mulligan Trainer integriert werden. Basiert auf der erfolgreichen Set 9 (Fabled) Integration.

## 🎯 Ziel
Neue Karten aus einem Set hinzufügen, ohne bestehende Funktionalität zu beeinträchtigen.

## 📋 Voraussetzungen
- Zugang zur lorcast.com API
- Git Repository Zugang
- Lokaler Development Server (Python HTTP Server)

---

## 🔧 Schritt-für-Schritt Anleitung

### 1. API-Daten von lorcast.com holen

**API Endpoint Pattern:**
```
https://lorcast.com/v0/cards?setNumber={SET_NUMBER}&offset=0&limit=300
```

**Beispiel für Set 10:**
```bash
curl "https://lorcast.com/v0/cards?setNumber=10&offset=0&limit=300" > set10_cards_full.json
```

**Wichtige Felder aus API Response:**
- `name` (Kartenname)
- `fullName` (Vollständiger Name mit Suffix)
- `cost` (Ink-Kosten)
- `inkwell` (Boolean für Ink-Fähigkeit)
- `images.thumbnail` (Bild-URL)

### 2. Fehlende Karten manuell erstellen

Prüfe ob alle Karten aus der API geholt wurden. Falls welche fehlen:

**Beispiel für fehlende Karte:**
```javascript
{
  "name": "Mickey Mouse",
  "fullName": "Mickey Mouse - Brave Little Tailor", 
  "cost": 4,
  "inkwell": true,
  "images": {
    "thumbnail": "https://lorcast.com/images/010-093.webp"
  }
}
```

### 3. allCards.json Update

**KRITISCH:** Backup erstellen BEVOR du änderst!
```bash
cp tools/lorcana-mulligan/data/allCards.json tools/lorcana-mulligan/data/allCards.json.backup
```

**Set-Metadaten hinzufügen** in `sets` Objekt:
```json
"10": {
  "prereleaseDate": "2025-XX-XX",
  "releaseDate": "2025-XX-XX", 
  "hasAllCards": true,
  "type": "expansion",
  "number": 10,
  "name": "SET_NAME"
}
```

**Karten zum `cards` Array hinzufügen** - Format genau einhalten:
```javascript
// Beispiel neuer Karte
{
  "Name": "Mickey Mouse",           // ← Großgeschrieben!
  "fullName": "Mickey Mouse - Brave Little Tailor", 
  "cost": 4,                       // ← Kleingeschrieben!
  "inkwell": true,                 // ← Kleingeschrieben! 
  "Set_Num": 10,
  "id": NEXT_ID,                   // Fortlaufende ID
  // ... andere Standard-Felder
}
```

### 4. Kartenbilder herunterladen

**Automatisches Download Script erstellen:**
```python
import requests
import json
import os
from urllib.parse import urlparse

def download_set_images(set_number, cards_data):
    base_dir = f"tools/lorcana-mulligan/assets/images/cards"
    os.makedirs(base_dir, exist_ok=True)
    
    for i, card in enumerate(cards_data):
        if 'images' in card and 'thumbnail' in card['images']:
            url = card['images']['thumbnail']
            filename = f"{set_number:03d}-{i+1:03d}.webp"
            
            response = requests.get(url)
            if response.status_code == 200:
                with open(f"{base_dir}/{filename}", 'wb') as f:
                    f.write(response.content)
                print(f"Downloaded: {filename}")
```

### 5. cardImageMap.js Update

**Mapping hinzufügen für neue Karten:**
```javascript
// Beispiel Entries hinzufügen:
"Mickey Mouse - Brave Little Tailor": "010-001.webp",
"Minnie Mouse - Fashion Designer": "010-002.webp",
// ...
```

**Pattern:** `"FULL_NAME": "SET_NUMBER-CARD_NUMBER.webp"`

---

## ⚠️ Häufige Probleme & Lösungen

### Problem 1: Inkable-Statistik falsch
**Symptom:** Alle Karten zeigen als inkable oder N/A

**Ursache:** Field-Name Inkonsistenz
- Import Code verwendet: `card.name` (klein)
- allCards.json verwendet: `Name` (groß)

**Fix:** Suche nach `card.name` und ersetze mit `card.Name` in:
- `calculateDeckStats()` Funktion
- `getCardManaCost()` Funktion 
- Card-Matching Logic

### Problem 2: Bilder laden nicht
**Symptom:** 404 Fehler für Kartenbilder

**Ursache:** Falsche Image-Mapping Logik

**Fix:** Prüfe dass `cardImageMap` lookup funktioniert:
```javascript
// In Import-Logic:
const imageKey = cardData ? (cardData.fullName || cardData.Name) : name;
const imageFile = cardImageMap[imageKey] || cardImageMap[name];
```

### Problem 3: Curve-Statistik fehlt
**Symptom:** Ink Curve wird nicht angezeigt

**Ursache:** `getCardManaCost()` findet keine Kosten

**Fix:** Field-Mapping in `getCardManaCost()`:
```javascript
// FALSCH:
if (cardData && typeof cardData.Cost === 'number') {
// RICHTIG:
if (cardData && typeof cardData.cost === 'number') {
```

### Problem 4: Gruppierung gebrochen
**Symptom:** "Found inkable card: (60x)" mit leerem Namen

**Ursache:** Fehler in deck.forEach() Schleife

**Fix:** Prüfe JavaScript Syntax-Fehler vor der Schleife

---

## 🧪 Testing Checklist

Nach jeder Änderung testen:

**Lokal (ohne Bilder):**
```bash
cd /path/to/project
python -m http.server 8080
# Öffne: http://localhost:8080/tools/lorcana-mulligan/
```

**Tests:**
- [ ] Deck Import funktioniert
- [ ] Statistik zeigt richtige Anzahl Uninkables  
- [ ] Kartennamen werden korrekt angezeigt
- [ ] Ink Curve wird angezeigt
- [ ] Mulligan funktioniert
- [ ] Neue Set-Karten werden erkannt

**Produktions-Test:**
- [ ] Alle Kartenbilder laden
- [ ] Performance ist acceptable

---

## 📁 Dateien die geändert werden

### Immer ändern:
- `tools/lorcana-mulligan/data/allCards.json` (Hauptdatenbank)
- `tools/lorcana-mulligan/data/cardImageMap.js` (Bild-Mapping)
- `tools/lorcana-mulligan/assets/images/cards/` (Neue Bilder)

### Eventuell ändern:
- `tools/lorcana-mulligan/index.html` (nur bei Bugs)
- `CLAUDE.md` (Update Current Issues)

### Backup-Dateien:
- `allCards.json.backup` (vorher erstellen!)
- `set{X}_cards_full.json` (API Response speichern)

---

## 🚀 Deployment

**Git Workflow:**
```bash
# 1. Änderungen stagen
git add tools/lorcana-mulligan/data/allCards.json
git add tools/lorcana-mulligan/data/cardImageMap.js  
git add tools/lorcana-mulligan/assets/images/cards/
git add set10_cards_full.json

# 2. Commit mit aussagekräftigem Message
git commit -m "Add Set 10 (SET_NAME) cards integration

- Add 200+ new Set 10 cards from lorcast.com API
- Update cardImageMap with new card image mappings
- Include all Set 10 card images (010-001.webp to 010-XXX.webp)
- Verify inkable detection and statistics accuracy

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. Push zu GitHub
git push origin main
```

---

## 🔍 Debug-Tipps

**Console Debugging aktivieren:**
```javascript
// Temporär hinzufügen für Debugging:
console.log('DEBUG: Card data found:', !!cardData);
console.log('DEBUG: Image file:', imageFile);
console.log('DEBUG: Grouped stats:', grouped);
```

**Häufige Debug-Stellen:**
- Import Loop (Zeile ~1490-1520)
- calculateDeckStats (Zeile ~920-980) 
- getCardManaCost (Zeile ~1300-1320)
- updateManaCurve (Zeile ~1176-1200)

---

## 📞 Support

Bei Problemen:
1. Prüfe Console auf JavaScript Fehler
2. Vergleiche mit funktionierender Set 9 Integration
3. Backup wiederherstellen falls alles kaputt
4. Diesen Guide nochmal durchgehen

**Backup Restore:**
```bash
cp tools/lorcana-mulligan/data/allCards.json.backup tools/lorcana-mulligan/data/allCards.json
git restore tools/lorcana-mulligan/index.html
```

---

*Letzte Aktualisierung: Nach Set 9 (Fabled) Integration - August 2025*
*Nächstes Update: Set 10 Integration - ca. Dezember 2025*