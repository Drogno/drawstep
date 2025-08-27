#!/usr/bin/env python3
"""
Rename matched Fabled cards with correct collector numbers from Lorcast API
"""

import requests
import json
import os
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

def get_downloaded_card_names():
    """Get list of downloaded card file names"""
    image_dir = Path("../tools/lorcana-mulligan/card-images")
    
    # Look for recently downloaded files (not the 009-XXX ones)
    all_files = []
    for file in image_dir.glob("*.jpg"):
        # Skip files that start with set numbers (001-, 002-, etc.)
        if not file.stem[:3].isdigit():
            all_files.append(file)
    
    print(f"Found {len(all_files)} downloaded card files")
    return all_files

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

def match_and_rename_cards():
    """Match downloaded cards with Lorcast data and rename them"""
    lorcast_cards = get_fabled_cards_from_lorcast()
    downloaded_files = get_downloaded_card_names()
    
    if not lorcast_cards or not downloaded_files:
        print("No cards to match")
        return
    
    print("\nMatching and renaming cards...")
    
    # Create lookup dict from Lorcast cards
    lorcast_lookup = {}
    for card in lorcast_cards:
        name = card.get('name', '')
        version = card.get('version', '')
        
        if name:
            # Add lookup for base name only
            safe_name = sanitize_filename(name)
            lorcast_lookup[safe_name] = card
            
            # Add lookup for "Name - Version" format if version exists
            if version:
                full_name = f"{name} - {version}"
                safe_full_name = sanitize_filename(full_name)
                lorcast_lookup[safe_full_name] = card
    
    print(f"Created lookup for {len(lorcast_lookup)} Lorcast entries")
    
    # Match and rename
    renamed_count = 0
    failed_count = 0
    matched_cards = []
    
    for file_path in downloaded_files:
        filename_without_ext = file_path.stem
        matched = False
        card = None
        
        # Direct match first
        if filename_without_ext in lorcast_lookup:
            card = lorcast_lookup[filename_without_ext]
            matched = True
        else:
            # Try to match by extracting base name (before " - ")
            original_name = filename_without_ext.replace('_', ' ').title()
            if ' - ' in original_name:
                base_name = original_name.split(' - ')[0]
                base_name_sanitized = sanitize_filename(base_name)
                
                if base_name_sanitized in lorcast_lookup:
                    card = lorcast_lookup[base_name_sanitized]
                    matched = True
        
        if matched and card:
            collector_number = card.get('collector_number', '')
            if collector_number:
                try:
                    # Create new filename: 009-XXX.jpg (pad with zeros)
                    # Convert collector_number to int if it's a string
                    try:
                        num = int(collector_number)
                        new_name = f"009-{num:03d}.jpg"
                    except (ValueError, TypeError):
                        new_name = f"009-{collector_number}.jpg"
                    new_path = file_path.parent / new_name
                    
                    # Only rename if new name doesn't exist
                    if not new_path.exists():
                        file_path.rename(new_path)
                        print(f"Renamed: {file_path.name} -> {new_name}")
                        renamed_count += 1
                        matched_cards.append({
                            'old_name': file_path.name,
                            'new_name': new_name,
                            'card_name': card.get('name', 'Unknown'),
                            'collector_number': collector_number
                        })
                    else:
                        print(f"Skipped: {new_name} already exists")
                        failed_count += 1
                except Exception as e:
                    print(f"Error renaming {file_path.name}: {e}")
                    failed_count += 1
            else:
                print(f"No collector number for {filename_without_ext}")
                failed_count += 1
        else:
            try:
                print(f"No match for {filename_without_ext}")
            except UnicodeEncodeError:
                print(f"No match for [Unicode error in filename]")
            failed_count += 1
    
    print(f"\nRenaming complete!")
    print(f"Successfully renamed: {renamed_count} files")
    print(f"Failed/Skipped: {failed_count} files")
    
    # Show some examples
    if matched_cards:
        print(f"\nSample renamed cards:")
        for card in sorted(matched_cards, key=lambda x: x['collector_number'])[:10]:
            try:
                print(f"  {card['new_name']}: {card['card_name']}")
            except UnicodeEncodeError:
                print(f"  {card['new_name']}: [Unicode error in name]")

def main():
    print("Renaming Fabled cards with correct collector numbers...")
    match_and_rename_cards()
    print("Done!")

if __name__ == "__main__":
    main()