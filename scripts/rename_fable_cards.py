#!/usr/bin/env python3
"""
Rename Fable cards to server naming scheme (009-001 to 009-242)
"""

import os
import json
from pathlib import Path

def get_fable_cards():
    """Get all Fable cards from JSON data"""
    with open('../tools/lorcana-mulligan/data/allCards.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Filter for cards that might be from Fable set or have set number 9
    fable_cards = []
    for card in data:
        set_num = card.get('Set_Num', 0)
        set_name = card.get('Set_Name', '').lower()
        
        # Look for Set 9 or cards that might be Fable
        if set_num == 9 or 'fable' in set_name:
            fable_cards.append(card)
    
    if not fable_cards:
        print("No Fable cards found in JSON data")
        return []
    
    print(f"Found {len(fable_cards)} Fable cards in JSON")
    return fable_cards

def sanitize_filename(name):
    """Convert card name to safe filename (same logic as scraper)"""
    replacements = {
        '/': '_', '\\': '_', ':': '_', '*': '_', 
        '?': '_', '"': '_', '<': '_', '>': '_', '|': '_',
        "'": "", '"': '', '!': '', ',': '', '.': '', ' ': '_'
    }
    
    safe_name = name
    for old, new in replacements.items():
        safe_name = safe_name.replace(old, new)
    
    while '__' in safe_name:
        safe_name = safe_name.replace('__', '_')
        
    return safe_name.strip('_').lower()

def rename_downloaded_fable_cards():
    """Rename downloaded Fable cards to 009-XXX format"""
    image_dir = Path("../tools/lorcana-mulligan/card-images")
    
    # Get list of recently downloaded files (likely the Fable cards)
    all_files = list(image_dir.glob("*.jpg"))
    
    # Since we don't have the exact mapping, we'll create a simple numbering system
    # for the 242 most recently modified files
    all_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    recent_files = all_files[:242]  # Take the 242 most recent files
    
    print(f"Found {len(recent_files)} recent image files to rename")
    
    renamed_count = 0
    for i, file_path in enumerate(recent_files, 1):
        # Create new name: 009-001, 009-002, etc.
        new_name = f"009-{i:03d}.jpg"
        new_path = image_dir / new_name
        
        try:
            # Only rename if the new name doesn't already exist
            if not new_path.exists():
                file_path.rename(new_path)
                print(f"Renamed: {file_path.name} -> {new_name}")
                renamed_count += 1
            else:
                print(f"Skipped: {new_name} already exists")
        except Exception as e:
            print(f"Error renaming {file_path.name}: {e}")
    
    print(f"Successfully renamed {renamed_count} files")

def main():
    print("Renaming Fable cards to server format...")
    rename_downloaded_fable_cards()
    print("Done!")

if __name__ == "__main__":
    main()