#!/usr/bin/env python3
"""
Integrate Fabled cards from Lorcast API into allCards.json
"""

import requests
import json
import time
from pathlib import Path

def get_fabled_cards_from_lorcast():
    """Get all Fabled cards from Lorcast API"""
    print("Fetching Fabled cards from Lorcast API...")
    time.sleep(0.1)  # Rate limiting
    
    try:
        response = requests.get('https://api.lorcast.com/v0/cards/search?q=set:9', timeout=30)
        response.raise_for_status()
        data = response.json()
        results = data.get('results', [])
        
        print(f"Found {len(results)} Fabled cards from Lorcast")
        return results
    except Exception as e:
        print(f"Error fetching from Lorcast: {e}")
        return []

def convert_lorcast_to_allcards_format(lorcast_card):
    """Convert a Lorcast card to allCards.json format"""
    # Map Lorcast format to allCards format
    converted = {
        "Artist": ", ".join(lorcast_card.get('illustrators', [])),
        "Set_Name": "Fabled",
        "Classifications": lorcast_card.get('classifications', ''),
        "Date_Added": lorcast_card.get('released_at', ''),
        "Set_Num": 9,
        "Color": lorcast_card.get('ink', ''),
        "Gamemode": "Lorcana",
        "Franchise": "",  # Not available in Lorcast
        "Image": "",  # We'll use local images
        "Cost": lorcast_card.get('cost', 0),
        "Inkable": lorcast_card.get('inkwell', False),
        "Name": lorcast_card.get('name', ''),
        "Type": lorcast_card.get('type', ''),
        "Lore": lorcast_card.get('lore', 0),
        "Rarity": lorcast_card.get('rarity', ''),
        "Flavor_Text": lorcast_card.get('flavor_text', ''),
        "Unique_ID": f"FAB-{lorcast_card.get('collector_number', '000')}",
        "Card_Num": 0,  # We'll set this from collector_number
        "Body_Text": lorcast_card.get('text', ''),
        "Willpower": lorcast_card.get('willpower', 0),
        "Card_Variants": "",
        "Date_Modified": lorcast_card.get('released_at', ''),
        "Strength": lorcast_card.get('strength', 0),
        "Set_ID": "FAB"
    }
    
    # Convert collector_number to Card_Num
    try:
        converted["Card_Num"] = int(lorcast_card.get('collector_number', 0))
    except (ValueError, TypeError):
        converted["Card_Num"] = 0
    
    # Handle version (subtitle)
    version = lorcast_card.get('version', '')
    if version:
        converted["Name"] = f"{converted['Name']} - {version}"
    
    # Handle move_cost for locations
    move_cost = lorcast_card.get('move_cost')
    if move_cost is not None:
        converted["Move_Cost"] = move_cost
    
    return converted

def integrate_fabled_cards():
    """Integrate Fabled cards into allCards.json"""
    # Load existing allCards.json
    allcards_path = "../tools/lorcana-mulligan/data/allCards.json"
    
    try:
        with open(allcards_path, 'r', encoding='utf-8') as f:
            existing_cards = json.load(f)
        print(f"Loaded {len(existing_cards)} existing cards")
    except Exception as e:
        print(f"Error loading allCards.json: {e}")
        return False
    
    # Get Fabled cards from Lorcast
    lorcast_cards = get_fabled_cards_from_lorcast()
    if not lorcast_cards:
        print("No Fabled cards to integrate")
        return False
    
    # Remove any existing Set 9 cards (cleanup)
    existing_cards = [card for card in existing_cards if card.get('Set_Num') != 9]
    print(f"After removing existing Set 9 cards: {len(existing_cards)} cards")
    
    # Convert Lorcast cards to allCards format
    converted_cards = []
    for lorcast_card in lorcast_cards:
        try:
            converted = convert_lorcast_to_allcards_format(lorcast_card)
            converted_cards.append(converted)
        except Exception as e:
            print(f"Error converting card {lorcast_card.get('name', 'Unknown')}: {e}")
    
    print(f"Successfully converted {len(converted_cards)} Fabled cards")
    
    # Combine existing and new cards
    all_cards = existing_cards + converted_cards
    print(f"Total cards after integration: {len(all_cards)}")
    
    # Create backup
    backup_path = allcards_path + ".backup"
    try:
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(existing_cards, f, indent=2, ensure_ascii=False)
        print(f"Backup created: {backup_path}")
    except Exception as e:
        print(f"Warning: Could not create backup: {e}")
    
    # Save updated allCards.json
    try:
        with open(allcards_path, 'w', encoding='utf-8') as f:
            json.dump(all_cards, f, indent=2, ensure_ascii=False)
        print(f"SUCCESS: Updated allCards.json with {len(converted_cards)} Fabled cards")
        return True
    except Exception as e:
        print(f"Error saving allCards.json: {e}")
        return False

def verify_integration():
    """Verify that the integration was successful"""
    print("\nVerifying integration...")
    
    try:
        with open("../tools/lorcana-mulligan/data/allCards.json", 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check for Fabled cards
        fabled_cards = [card for card in data if card.get('Set_Num') == 9]
        print(f"Fabled cards in allCards.json: {len(fabled_cards)}")
        
        if fabled_cards:
            # Check sample card has required fields
            sample = fabled_cards[0]
            required_fields = ['Name', 'Cost', 'Inkable', 'Type', 'Set_Num', 'Card_Num']
            missing_fields = [field for field in required_fields if field not in sample]
            
            if missing_fields:
                print(f"WARNING: Missing required fields: {missing_fields}")
            else:
                print("SUCCESS: All required fields present")
            
            # Show sample cards
            print("\nSample Fabled cards:")
            for card in sorted(fabled_cards, key=lambda x: x.get('Card_Num', 0))[:5]:
                name = card.get('Name', 'Unknown')
                cost = card.get('Cost', '?')
                inkable = 'Ink' if card.get('Inkable') else 'Unink'
                card_type = card.get('Type', '?')
                num = card.get('Card_Num', '?')
                
                try:
                    print(f"  {num:3}: {name} ({cost} cost, {inkable}, {card_type})")
                except UnicodeEncodeError:
                    print(f"  {num:3}: [Unicode name] ({cost} cost, {inkable}, {card_type})")
        
        return len(fabled_cards) > 0
        
    except Exception as e:
        print(f"Error verifying integration: {e}")
        return False

def main():
    print("Integrating Fabled cards into allCards.json...")
    
    if integrate_fabled_cards():
        verify_integration()
        print("\nIntegration complete! The mulligan trainer should now be able to use Fabled cards.")
    else:
        print("Integration failed!")

if __name__ == "__main__":
    main()