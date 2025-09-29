/**
 * ============================================
 * CARD IMAGE MAP GENERATOR
 * ============================================
 * 
 * This Node.js script generates a mapping from card names to image files.
 * It reads the allCards.json file and creates cardImageMap.js with the mapping.
 * 
 * Purpose:
 * - Maps card names to their corresponding image filenames
 * - Filters out special rarities (enchanted, promo, d23, special)
 * - Creates standardized filename format (XXX-YYY.webp)
 * 
 * Usage: node generateMap.js
 * 
 * @author Drawstep Project
 * @version 1.0
 */

console.log('Starting card image mapping generation...');

// File system module for reading/writing files
const fs = require('fs');

// Read and parse the all cards JSON data
const data = JSON.parse(fs.readFileSync('allCards.json', 'utf8'));
console.log('Total cards in JSON:', data.cards.length);

// Initialize empty mapping object
let map = {};

// Process each card to create name -> filename mapping
data.cards.forEach(card => {
    const rarity = (card.rarity || '').toLowerCase();
    
    // Only include cards with required properties and standard rarities
    if (card.setCode && card.number && card.fullName &&
        rarity !== 'enchanted' &&
        rarity !== 'promo' &&
        rarity !== 'd23' &&
        rarity !== 'special' // Exclude special rarities
    ) {
        // Create standardized filename format: XXX-YYY.webp
        const set = String(card.setCode).padStart(3, '0');
        const num = String(card.number).padStart(3, '0');
        const file = `${set}-${num}.webp`;
        
        // Map card name to filename
        map[card.fullName] = file;
    }
});

console.log('Cards in final mapping:', Object.keys(map).length);

// Generate JavaScript file content
let output = 'const cardImageMap = {\n';
Object.entries(map).forEach(([name, file]) => {
    // Escape quotes in card names for valid JavaScript
    const escapedName = name.replace(/"/g, '\\"');
    output += `  "${escapedName}": "${file}",\n`;
});
output += '};\n';

// Write the mapping to cardImageMap.js file
fs.writeFileSync('cardImageMap.js', output, 'utf8');
console.log('Complete! Card mapping saved to cardImageMap.js');