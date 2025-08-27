#!/usr/bin/env python3
"""
Update card 93 "Daisy Duck - Secret Agent" with correct user-provided data
"""

import json

def update_card_93_with_correct_data():
    """Update Daisy Duck - Secret Agent with correct data"""
    
    # Load existing allCards.json
    allcards_path = "../tools/lorcana-mulligan/data/allCards.json"
    
    try:
        with open(allcards_path, 'r', encoding='utf-8') as f:
            all_cards = json.load(f)
        print(f"Loaded {len(all_cards)} existing cards")
    except Exception as e:
        print(f"Error loading allCards.json: {e}")
        return False
    
    # Find card 93
    card_93_found = False
    for i, card in enumerate(all_cards):
        if card.get('Set_Num') == 9 and card.get('Card_Num') == 93:
            # Update with correct data
            all_cards[i] = {
                "Artist": "Unknown",  # Not provided
                "Set_Name": "Fabled",
                "Classifications": "Dreamborn, Ally",
                "Date_Added": "2025-08-29",
                "Set_Num": 9,
                "Color": "Emerald",
                "Gamemode": "Lorcana",
                "Franchise": "Disney",
                "Image": "",
                "Cost": 4,
                "Inkable": True,
                "Name": "Daisy Duck - Secret Agent",
                "Type": "Character",
                "Lore": 2,
                "Rarity": "Uncommon",
                "Flavor_Text": "",
                "Unique_ID": "FAB-093",
                "Card_Num": 93,
                "Body_Text": "THWART Whenever this character quests, each opponent chooses and discards a card.",
                "Willpower": 3,
                "Card_Variants": "",
                "Date_Modified": "2025-08-29",
                "Strength": 2,
                "Set_ID": "FAB"
            }
            card_93_found = True
            break
    
    if not card_93_found:
        print("Card 93 not found!")
        return False
    
    # Save updated allCards.json
    try:
        with open(allcards_path, 'w', encoding='utf-8') as f:
            json.dump(all_cards, f, indent=2, ensure_ascii=False)
        print("SUCCESS: Updated Daisy Duck - Secret Agent with correct data")
        
        # Verify the update
        updated_card = [card for card in all_cards if card.get('Set_Num') == 9 and card.get('Card_Num') == 93][0]
        print(f"Verified card 93:")
        print(f"  Name: {updated_card.get('Name')}")
        print(f"  Cost: {updated_card.get('Cost')}")
        print(f"  Inkable: {updated_card.get('Inkable')}")
        print(f"  Color: {updated_card.get('Color')}")
        print(f"  Type: {updated_card.get('Type')}")
        print(f"  Lore: {updated_card.get('Lore')}")
        print(f"  Strength: {updated_card.get('Strength')}")
        print(f"  Willpower: {updated_card.get('Willpower')}")
        print(f"  Rarity: {updated_card.get('Rarity')}")
        print(f"  Classifications: {updated_card.get('Classifications')}")
        print(f"  Body_Text: {updated_card.get('Body_Text')}")
        
        return True
    except Exception as e:
        print(f"Error saving allCards.json: {e}")
        return False

def main():
    print("Updating card 93 with correct user-provided data...")
    
    if update_card_93_with_correct_data():
        print("Update successful! Daisy Duck - Secret Agent now has correct data.")
    else:
        print("Update failed!")

if __name__ == "__main__":
    main()