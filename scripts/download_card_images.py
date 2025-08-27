#!/usr/bin/env python3
"""
Automated Card Image Downloader for Dreamborn.ink
Downloads all card images for a specific set automatically
"""

import requests
import json
import os
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

class CardImageDownloader:
    def __init__(self, base_url="https://dreamborn.ink", download_dir="../tools/lorcana-mulligan/card-images"):
        self.base_url = base_url
        self.download_dir = Path(download_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def get_cards_from_json(self, json_file="../tools/lorcana-mulligan/data/allCards.json"):
        """Load cards from your existing allCards.json"""
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle different formats
        if isinstance(data, list):
            return data  # Direct list of cards (our format)
        elif isinstance(data, dict):
            return data.get('cards', data.get('data', []))
        else:
            return []
    
    def download_image(self, card_name, image_url, retries=3):
        """Download a single card image with retry logic"""
        safe_name = self.sanitize_filename(card_name)
        file_path = self.download_dir / f"{safe_name}.jpg"
        
        # Skip if already exists
        if file_path.exists():
            print(f"OK {card_name} already exists")
            return True
            
        for attempt in range(retries):
            try:
                print(f"Downloading {card_name}... (attempt {attempt + 1})")
                
                response = self.session.get(image_url, timeout=30)
                response.raise_for_status()
                
                # Ensure directory exists
                file_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Save image
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                
                print(f"SUCCESS {card_name} downloaded")
                time.sleep(1)  # Be nice to the server
                return True
                
            except Exception as e:
                print(f"FAILED to download {card_name}: {e}")
                if attempt < retries - 1:
                    time.sleep(5)  # Wait before retry
                
        return False
    
    def sanitize_filename(self, name):
        """Convert card name to safe filename"""
        # Replace problematic characters
        replacements = {
            '/': '_', '\\': '_', ':': '_', '*': '_', 
            '?': '_', '"': '_', '<': '_', '>': '_', '|': '_',
            "'": "", '"': '', '!': '', ',': '', '.': '', ' ': '_'
        }
        
        safe_name = name
        for old, new in replacements.items():
            safe_name = safe_name.replace(old, new)
        
        # Remove multiple underscores
        while '__' in safe_name:
            safe_name = safe_name.replace('__', '_')
            
        return safe_name.strip('_').lower()
    
    def download_set(self, set_code=None, set_name=None):
        """Download all images for a specific set"""
        cards = self.get_cards_from_json()
        
        # Filter by set if specified
        if set_code:
            cards = [card for card in cards if card.get('Set_ID') == set_code]
        elif set_name:
            cards = [card for card in cards if set_name.lower() in card.get('Set_Name', '').lower()]
        
        print(f"Found {len(cards)} cards to download")
        
        success_count = 0
        failed_cards = []
        
        for i, card in enumerate(cards, 1):
            card_name = card.get('Name', 'Unknown')
            print(f"\n[{i}/{len(cards)}] Processing: {card_name}")
            
            # Get image URL directly from card data
            image_url = card.get('Image')
            
            if image_url:
                if self.download_image(card_name, image_url):
                    success_count += 1
                else:
                    failed_cards.append(card_name)
            else:
                print(f"ERROR No image URL found for {card_name}")
                failed_cards.append(card_name)
        
        print(f"\nDownload Summary:")
        print(f"Successful: {success_count}")
        print(f"Failed: {len(failed_cards)}")
        
        if failed_cards:
            print(f"\nFailed cards: {', '.join(failed_cards)}")
    

def main():
    downloader = CardImageDownloader()
    
    print("Starting card image download...")
    
    # Option 1: Download specific set by code
    # downloader.download_set(set_code="ARI")  # Archazia's Island
    
    # Option 2: Download specific set by name  
    downloader.download_set(set_name="Reign of Jafar")  # Download newest set (Set 8)
    
    # Option 3: Download all missing cards
    # downloader.download_set()

if __name__ == "__main__":
    main()