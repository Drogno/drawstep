#!/usr/bin/env python3
"""
Simple Dreamborn.ink Scraper - No scrolling, just capture what's loaded
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import requests
import os
import time

class SimpleDreambornScraper:
    def __init__(self, headless=False):
        self.setup_driver(headless)
        self.download_dir = "../tools/lorcana-mulligan/card-images"
        os.makedirs(self.download_dir, exist_ok=True)
    
    def setup_driver(self, headless):
        options = Options()
        if headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        self.driver = webdriver.Chrome(options=options)
    
    def capture_loaded_cards(self, set_url):
        """Capture all currently loaded cards without scrolling"""
        print(f"Navigating to: {set_url}")
        self.driver.get(set_url)
        
        # Wait for page to load
        print("Waiting for page to load...")
        time.sleep(10)  # Longer wait for initial load
        
        # Find all card image elements
        selectors = [
            "img[src*='card']",
            "img[src*='lorcana']",
            "[class*='card'] img"
        ]
        
        all_cards = []
        for selector in selectors:
            card_images = self.driver.find_elements(By.CSS_SELECTOR, selector)
            print(f"Found {len(card_images)} images with selector: {selector}")
            
            for img in card_images:
                try:
                    src = img.get_attribute('src')
                    alt = img.get_attribute('alt') or img.get_attribute('title') or 'Unknown Card'
                    
                    if src and ('card' in src.lower() or 'lorcana' in src.lower()):
                        all_cards.append({
                            'name': alt,
                            'image_url': src
                        })
                except Exception as e:
                    print(f"Error processing image: {e}")
        
        # Remove duplicates
        unique_cards = {}
        for card in all_cards:
            unique_cards[card['image_url']] = card
        cards_data = list(unique_cards.values())
        
        print(f"Total unique cards found: {len(cards_data)}")
        print("Waiting 60 seconds for manual scrolling to load all 242 cards...")
        time.sleep(60)  # Give time for manual scrolling
        
        # Capture again after manual scrolling
        print("Capturing cards after manual scrolling...")
        all_cards = []
        for selector in selectors:
            card_images = self.driver.find_elements(By.CSS_SELECTOR, selector)
            print(f"After scrolling - Found {len(card_images)} images with selector: {selector}")
            
            for img in card_images:
                try:
                    src = img.get_attribute('src')
                    alt = img.get_attribute('alt') or img.get_attribute('title') or 'Unknown Card'
                    
                    if src and ('card' in src.lower() or 'lorcana' in src.lower()):
                        all_cards.append({
                            'name': alt,
                            'image_url': src
                        })
                except Exception as e:
                    pass  # Skip errors
        
        # Remove duplicates again
        unique_cards = {}
        for card in all_cards:
            unique_cards[card['image_url']] = card
        cards_data = list(unique_cards.values())
        
        print(f"Final count: {len(cards_data)} unique cards")
        return cards_data
    
    def download_card_images(self, cards_data):
        """Download all card images"""
        success_count = 0
        
        for i, card in enumerate(cards_data, 1):
            name = card['name']
            url = card['image_url']
            
            print(f"[{i}/{len(cards_data)}] Downloading: {name}")
            
            try:
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                
                # Sanitize filename
                safe_name = self.sanitize_filename(name)
                file_path = os.path.join(self.download_dir, f"{safe_name}.jpg")
                
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                
                success_count += 1
                time.sleep(0.5)  # Shorter delay
                
            except Exception as e:
                print(f"FAILED to download {name}: {e}")
        
        print(f"Successfully downloaded {success_count} images")
    
    def sanitize_filename(self, name):
        """Convert card name to safe filename"""
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
    
    def close(self):
        self.driver.quit()

def main():
    scraper = SimpleDreambornScraper(headless=False)
    
    try:
        # Scrape Fable set
        set_url = "https://dreamborn.ink/cards?setId=009"
        cards_data = scraper.capture_loaded_cards(set_url)
        
        if cards_data:
            scraper.download_card_images(cards_data)
        else:
            print("ERROR: No cards found")
    
    finally:
        scraper.close()

if __name__ == "__main__":
    main()