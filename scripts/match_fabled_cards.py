#!/usr/bin/env python3
"""
Match downloaded Fabled cards with Lorcast API data to get correct collector numbers
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
    
    # Look for recently downloaded files (not the 009-XXX ones that failed to rename)
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

def match_cards():
    """Match downloaded cards with Lorcast data"""
    lorcast_cards = get_fabled_cards_from_lorcast()
    downloaded_files = get_downloaded_card_names()
    
    if not lorcast_cards or not downloaded_files:
        print("No cards to match")
        return []
    
    print("\nMatching cards...")
    matches = []
    unmatched_downloads = []
    unmatched_lorcast = []
    
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
    
    print(f"Created lookup for {len(lorcast_lookup)} Lorcast cards")
    
    # Try to match downloaded files
    for file_path in downloaded_files:
        filename_without_ext = file_path.stem
        matched = False
        
        # Direct match first
        if filename_without_ext in lorcast_lookup:
            card = lorcast_lookup[filename_without_ext]
            collector_number = card.get('collector_number', '?')
            matches.append({
                'file_path': file_path,
                'filename': filename_without_ext,
                'card_name': card.get('name', 'Unknown'),
                'collector_number': collector_number,
                'lorcast_card': card
            })
            del lorcast_lookup[filename_without_ext]
            matched = True
        else:
            # Try to match by extracting base name (before " - ")
            # Convert back to original format to extract base name
            original_name = filename_without_ext.replace('_', ' ').title()
            if ' - ' in original_name:
                base_name = original_name.split(' - ')[0]
                base_name_sanitized = sanitize_filename(base_name)
                
                if base_name_sanitized in lorcast_lookup:
                    card = lorcast_lookup[base_name_sanitized]
                    collector_number = card.get('collector_number', '?')
                    matches.append({
                        'file_path': file_path,
                        'filename': filename_without_ext,
                        'card_name': card.get('name', 'Unknown'),
                        'collector_number': collector_number,
                        'lorcast_card': card
                    })
                    del lorcast_lookup[base_name_sanitized]
                    matched = True
        
        if not matched:
            unmatched_downloads.append(filename_without_ext)
    
    # Remaining lorcast cards are unmatched
    unmatched_lorcast = list(lorcast_lookup.keys())
    
    print(f"\nMatching Results:")
    print(f"OK Matched: {len(matches)} cards")
    print(f"FAIL Unmatched downloads: {len(unmatched_downloads)}")
    print(f"FAIL Unmatched Lorcast: {len(unmatched_lorcast)}")
    
    if unmatched_downloads:
        print(f"\nUnmatched download files (first 10):")
        for name in unmatched_downloads[:10]:
            try:
                print(f"  - {name}")
            except UnicodeEncodeError:
                print(f"  - [Unicode error in filename]")
    
    if unmatched_lorcast:
        print(f"\nUnmatched Lorcast cards (first 10):")
        for name in unmatched_lorcast[:10]:
            # Find original card name
            original_card = next((c for c in lorcast_cards if sanitize_filename(c.get('name', '')) == name), None)
            if original_card:
                try:
                    print(f"  - {name} (original: {original_card.get('name', 'Unknown')})")
                except UnicodeEncodeError:
                    print(f"  - [Unicode error in card name]")
    
    # Show some successful matches
    if matches:
        print(f"\nSample matches:")
        for match in sorted(matches, key=lambda x: x['collector_number'])[:10]:
            print(f"  {match['collector_number']:3}: {match['card_name']} -> {match['filename']}")
    
    return matches

def main():
    print("Matching Fabled cards with Lorcast API data...")
    matches = match_cards()
    
    if matches:
        print(f"\nSUMMARY: Successfully matched {len(matches)} cards with collector numbers")
        print("Ready for renaming step!")
    else:
        print("ERROR: No matches found")

if __name__ == "__main__":
    main()