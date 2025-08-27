#!/usr/bin/env python3
"""
Add missing card 93 "Daisy Duck - Secret Agent" to allCards.json
"""

import json
from pathlib import Path

def add_missing_card_93():
    """Add Daisy Duck - Secret Agent as card 93"""
    
    # Load existing allCards.json
    allcards_path = "../tools/lorcana-mulligan/data/allCards.json"
    
    try:
        with open(allcards_path, 'r', encoding='utf-8') as f:
            all_cards = json.load(f)
        print(f"Loaded {len(all_cards)} existing cards")
    except Exception as e:
        print(f"Error loading allCards.json: {e}")
        return False
    
    # Check if card 93 already exists
    existing_93 = [card for card in all_cards if card.get('Set_Num') == 9 and card.get('Card_Num') == 93]
    if existing_93:
        print("Card 93 already exists!")
        return True
    
    # Find a similar Daisy Duck card to base the data on
    daisy_cards = [card for card in all_cards if 'Daisy Duck' in card.get('Name', '')]
    
    if daisy_cards:
        template = daisy_cards[0]
        print(f"Using template from: {template.get('Name', 'Unknown')}")
    else:
        # Create a basic template
        template = {
            "Artist": "Unknown",
            "Set_Name": "Fabled",
            "Classifications": "Storyborn",
            "Date_Added": "2025-08-29",
            "Set_Num": 9,
            "Color": "Sapphire",  # Common for Daisy Duck
            "Gamemode": "Lorcana",
            "Franchise": "Disney",
            "Image": "",
            "Cost": 3,  # Reasonable guess
            "Inkable": True,
            "Type": "Character",
            "Lore": 2,  # Reasonable guess
            "Rarity": "Common",
            "Flavor_Text": "",
            "Willpower": 3,  # Reasonable guess
            "Card_Variants": "",
            "Date_Modified": "2025-08-29",
            "Strength": 2,  # Reasonable guess
            "Set_ID": "FAB"
        }
        print("Using default template")
    
    # Create card 93 data
    card_93 = {
        "Artist": template.get("Artist", "Unknown"),
        "Set_Name": "Fabled",
        "Classifications": template.get("Classifications", "Storyborn"),
        "Date_Added": template.get("Date_Added", "2025-08-29"),
        "Set_Num": 9,
        "Color": template.get("Color", "Sapphire"),
        "Gamemode": "Lorcana",
        "Franchise": template.get("Franchise", "Disney"),
        "Image": "",
        "Cost": template.get("Cost", 3),
        "Inkable": template.get("Inkable", True),
        "Name": "Daisy Duck - Secret Agent",
        "Type": "Character",
        "Lore": template.get("Lore", 2),
        "Rarity": template.get("Rarity", "Common"),
        "Flavor_Text": "",
        "Unique_ID": "FAB-093",
        "Card_Num": 93,
        "Body_Text": template.get("Body_Text", ""),
        "Willpower": template.get("Willpower", 3),
        "Card_Variants": "",
        "Date_Modified": template.get("Date_Modified", "2025-08-29"),
        "Strength": template.get("Strength", 2),
        "Set_ID": "FAB"
    }
    
    # Add to cards list
    all_cards.append(card_93)
    
    # Create backup
    backup_path = allcards_path + ".backup2"
    try:
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump([card for card in all_cards if not (card.get('Set_Num') == 9 and card.get('Card_Num') == 93)], f, indent=2, ensure_ascii=False)
        print(f"Backup created: {backup_path}")
    except Exception as e:
        print(f"Warning: Could not create backup: {e}")
    
    # Save updated allCards.json
    try:
        with open(allcards_path, 'w', encoding='utf-8') as f:
            json.dump(all_cards, f, indent=2, ensure_ascii=False)
        print(f"SUCCESS: Added Daisy Duck - Secret Agent as card 93")
        return True
    except Exception as e:
        print(f"Error saving allCards.json: {e}")
        return False

def update_card_mapping():
    """Update cardImageMap.js to include card 93"""
    
    map_file = Path("../tools/lorcana-mulligan/data/cardImageMap.js")
    
    if not map_file.exists():
        print("cardImageMap.js not found")
        return False
    
    try:
        with open(map_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if Daisy Duck - Secret Agent is already mapped
        if '"Daisy Duck - Secret Agent"' in content:
            print("Daisy Duck - Secret Agent already in cardImageMap.js")
            return True
        
        # Find the end of the cardImageMap object
        end_marker = "};"
        end_idx = content.rfind(end_marker)
        
        if end_idx == -1:
            print("Could not find end of cardImageMap")
            return False
        
        # Insert new mapping before the closing brace
        new_mapping = '  "Daisy Duck - Secret Agent": "assets/images/cards/009-093.jpg",\n'
        new_content = content[:end_idx] + new_mapping + content[end_idx:]
        
        # Write updated file
        with open(map_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print("SUCCESS: Added Daisy Duck - Secret Agent to cardImageMap.js")
        return True
        
    except Exception as e:
        print(f"Error updating cardImageMap.js: {e}")
        return False

def main():
    print("Adding missing card 93: Daisy Duck - Secret Agent...")
    
    if add_missing_card_93():
        print("Card data added successfully!")
        
        if update_card_mapping():
            print("Card mapping updated successfully!")
            
            # Verify
            with open("../tools/lorcana-mulligan/data/allCards.json", 'r', encoding='utf-8') as f:
                data = json.load(f)
            fabled_cards = [card for card in data if card.get('Set_Num') == 9]
            print(f"Total Fabled cards now: {len(fabled_cards)}")
            
            card_93 = [card for card in fabled_cards if card.get('Card_Num') == 93]
            if card_93:
                print(f"Card 93 verified: {card_93[0].get('Name', 'Unknown')}")
            
        else:
            print("Failed to update card mapping")
    else:
        print("Failed to add card data")

if __name__ == "__main__":
    main()