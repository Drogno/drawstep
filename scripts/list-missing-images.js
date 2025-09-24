#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const cardsDir = path.join(projectRoot, 'tools', 'lorcana-mulligan', 'assets', 'images', 'cards');
const allCardsPath = path.join(projectRoot, 'tools', 'lorcana-mulligan', 'data', 'allCards.json');

const existingImages = new Set(
  fs.readdirSync(cardsDir).filter(name => name.toLowerCase().endsWith('.webp'))
);

const raw = JSON.parse(fs.readFileSync(allCardsPath, 'utf8'));

function collectCards(data) {
  if (!data) return [];
  if (Array.isArray(data.cards)) return data.cards;
  if (Array.isArray(data)) return data;
  return Object.values(data)
    .filter(Array.isArray)
    .flat();
}

const cards = collectCards(raw);
const missing = new Set();

for (const card of cards) {
  const setCode = card.setCode || card.Set_Num || card.set_num || card.set_code;
  const number = card.number || card.Card_Num || card.card_num || card.code;
  if (!setCode || !number) continue;
  const filename = `${String(setCode).padStart(3, '0')}-${String(number).padStart(3, '0')}.webp`;
  if (!existingImages.has(filename)) {
    missing.add(filename);
  }
}

console.log(`Missing ${missing.size} images:`);
for (const file of missing) {
  console.log(file);
}
