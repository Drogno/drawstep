#!/usr/bin/env python3
"""
Update cardImageMap.js to include Fabled cards in assets/images/cards
"""

import json
from pathlib import Path

def update_card_mapping_with_fabled():
    """Update cardImageMap.js to include Fabled cards"""
    
    # Load allCards.json to get card names
    print("Loading card data...")
    with open('../tools/lorcana-mulligan/data/allCards.json', 'r', encoding='utf-8') as f:
        all_cards = json.load(f)
    
    # Check for Fabled cards
    fabled_cards = [card for card in all_cards if card.get('Set_Num') == 9]
    print(f"Found {len(fabled_cards)} Fabled cards in allCards.json")
    
    if not fabled_cards:
        print("No Fabled cards found! Run integrate_fabled_cards.py first")
        return False
    
    # Check available image files
    image_dir = Path("../tools/lorcana-mulligan/assets/images/cards")
    available_images = {}
    
    for image_file in image_dir.glob("009-*.jpg"):
        # Extract number from filename (009-001.jpg -> 1)
        try:
            num = int(image_file.stem.split('-')[1])
            available_images[num] = f"assets/images/cards/{image_file.name}"
        except (ValueError, IndexError):
            print(f"Invalid filename format: {image_file.name}")
    
    print(f"Found {len(available_images)} Fabled card images")
    
    # Create mapping from card names to image paths
    card_image_mapping = {}
    
    for card in fabled_cards:
        card_name = card.get('Name', '')
        card_num = card.get('Card_Num', 0)
        
        if card_name and card_num in available_images:
            card_image_mapping[card_name] = available_images[card_num]
    
    print(f"Mapped {len(card_image_mapping)} Fabled cards")
    
    # Load existing cardImageMap.js
    map_file = Path("../tools/lorcana-mulligan/data/cardImageMap.js")
    
    if map_file.exists():
        with open(map_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract existing mapping
        start_marker = "const cardImageMap = {"
        end_marker = "};"
        
        start_idx = content.find(start_marker)
        end_idx = content.find(end_marker, start_idx) + len(end_marker)
        
        if start_idx != -1 and end_idx != -1:
            # Parse existing entries (simple parsing)
            existing_lines = content[start_idx + len(start_marker):end_idx - len(end_marker)].strip()
            print("Found existing cardImageMap.js")
        else:
            existing_lines = ""
            print("Creating new cardImageMap.js")
    else:
        existing_lines = ""
        print("Creating new cardImageMap.js")
    
    # Generate new cardImageMap.js content
    output_lines = []
    output_lines.append("// Auto-generated card image mapping")
    output_lines.append("// Updated with Fabled cards")
    output_lines.append("")
    output_lines.append("const cardImageMap = {")
    
    # Add existing entries (if any) - skip Fabled cards
    if existing_lines:
        for line in existing_lines.split('\n'):
            line = line.strip()
            if line and not line.startswith('//') and '"' in line:
                # Check if it's not a Fabled card (Set 9)
                if not any(fabled_name in line for fabled_name in card_image_mapping.keys()):
                    output_lines.append(f"  {line}")
    
    # Add Fabled card mappings
    for card_name, image_path in sorted(card_image_mapping.items()):
        # Escape quotes in card names
        escaped_name = card_name.replace('\\', '\\\\').replace('"', '\\"')
        output_lines.append(f'  "{escaped_name}": "{image_path}",')
    
    output_lines.append("};")
    output_lines.append("")
    output_lines.append("// Export for use in modules")
    output_lines.append("if (typeof module !== 'undefined' && module.exports) {")
    output_lines.append("  module.exports = cardImageMap;")
    output_lines.append("}")
    
    # Write updated file
    with open(map_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    
    print(f"SUCCESS: Updated cardImageMap.js with {len(card_image_mapping)} Fabled cards")
    return True

def main():
    print("Updating cardImageMap.js with Fabled cards...")
    
    if update_card_mapping_with_fabled():
        print("Update complete! Mulligan trainer should now find Fabled card images.")
    else:
        print("Update failed!")

if __name__ == "__main__":
    main()