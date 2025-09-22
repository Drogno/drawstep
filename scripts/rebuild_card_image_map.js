#!/usr/bin/env node
/*
 * Rebuild cardImageMap.js based on data/allCards.json and available card images.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'tools', 'lorcana-mulligan', 'data');
const imagesDir = path.join(projectRoot, 'tools', 'lorcana-mulligan', 'assets', 'images', 'cards');
const allCardsPath = path.join(dataDir, 'allCards.json');
const outputPath = path.join(dataDir, 'cardImageMap.js');

function pad(value) {
  return String(value).padStart(3, '0');
}

function normalizeCardData(raw) {
  if (!raw) return [];
  if (Array.isArray(raw.cards)) return raw.cards;
  if (Array.isArray(raw)) return raw;
  const values = Object.values(raw);
  if (values.every(Array.isArray)) {
    return values.flat();
  }
  return values;
}

function rebuild() {
  if (!fs.existsSync(allCardsPath)) {
    console.error('allCards.json not found at', allCardsPath);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(allCardsPath, 'utf8'));
  const cards = normalizeCardData(raw);
  if (!Array.isArray(cards) || cards.length === 0) {
    console.error('No cards found in allCards.json');
    process.exit(1);
  }

  const availableImages = new Set(
    fs.readdirSync(imagesDir)
      .filter(name => name.toLowerCase().endsWith('.webp'))
  );

  const map = {};
  const missingImages = new Set();

  const addKey = (key, file) => {
    if (!key) return;
    if (map[key]) return;
    map[key] = file;
  };

  cards.forEach(card => {
    const setCode = card.setCode || card.Set_Num || card.set_num || card.set_code;
    const number = card.number || card.Card_Num || card.card_num || card.code;
    const fullName = card.fullName || card.FullName || (card.name && card.version ? `${card.name} - ${card.version}` : null);
    const displayName = card.name || card.Name;

    if (!setCode || !number || !fullName) {
      return;
    }

    const filename = `${pad(setCode)}-${pad(number)}.webp`;
    if (!availableImages.has(filename)) {
      missingImages.add(filename);
      return;
    }

    addKey(fullName, filename);
    if (displayName && displayName !== fullName) addKey(displayName, filename);
    addKey(fullName.toLowerCase(), filename);
    if (displayName) addKey(displayName.toLowerCase(), filename);
  });

  const sortedKeys = Object.keys(map).sort((a, b) => a.localeCompare(b));
  let output = 'const cardImageMap = {\n';
  sortedKeys.forEach(key => {
    const safeKey = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    output += `  "${safeKey}": "${map[key]}",\n`;
  });
  output += '};\n\nif (typeof module !== "undefined") {\n  module.exports = cardImageMap;\n}\n';

  fs.writeFileSync(outputPath, output, 'utf8');

  console.log(`Written ${sortedKeys.length} entries to cardImageMap.js`);
  if (missingImages.size > 0) {
    console.warn('Images missing for', missingImages.size, 'cards. Example:', Array.from(missingImages).slice(0, 5));
  }
}

rebuild();
