#!/usr/bin/env python3
"""
Dreamborn.ink Browser Automation Scraper
Uses Selenium to navigate and download card images like a real browser
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import requests
import json
import os
import time

class DreambornScraper:
    def __init__(self, headless=True):
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
        self.wait = WebDriverWait(self.driver, 10)
    
    def scrape_set_page(self, set_url):
        """Navigate to a set page and extract all card image URLs"""
        print(f"Navigating to: {set_url}")
        self.driver.get(set_url)
        
        # Wait for page to load
        time.sleep(5)
        
        # Scroll down gradually to load all 242 cards
        print("Loading all cards by scrolling...")
        total_cards_found = 0
        scroll_attempts = 0
        max_scroll_attempts = 30  # Increased for 242 cards
        
        while scroll_attempts < max_scroll_attempts:
            # Scroll down gradually
            self.driver.execute_script("window.scrollBy(0, 1000);")
            time.sleep(3)  # Wait longer for cards to load
            
            # Count current cards
            current_cards = len(self.driver.find_elements(By.CSS_SELECTOR, "img[src*='card']"))
            print(f"Scroll {scroll_attempts + 1}: Found {current_cards} cards")
            
            # If we found new cards, continue
            if current_cards > total_cards_found:
                total_cards_found = current_cards
                scroll_attempts += 1
                
                # If we're close to 242, try a few more times
                if current_cards >= 242:
                    print(f"Found target of 242 cards! ({current_cards} total)")
                    break
            else:
                # No new cards found, try a few more times before giving up
                scroll_attempts += 1
                if scroll_attempts > max_scroll_attempts - 5:
                    print("No new cards loading, finishing...")
                    break
        
        print(f"Final scroll result: {total_cards_found} cards found after {scroll_attempts} attempts")
        
        # Find all card image elements - try multiple selectors
        selectors = [
            "img[src*='card']",
            "img[alt*='card']", 
            ".card-image img",
            "[class*='card'] img",
            "img[src*='lorcana']"
        ]
        
        cards_data = []
        for selector in selectors:
            card_images = self.driver.find_elements(By.CSS_SELECTOR, selector)
            print(f"Found {len(card_images)} images with selector: {selector}")
            
            for img in card_images:
                try:
                    src = img.get_attribute('src')
                    alt = img.get_attribute('alt') or img.get_attribute('title') or 'Unknown Card'
                    
                    if src and ('card' in src.lower() or 'lorcana' in src.lower()):
                        cards_data.append({
                            'name': alt,
                            'image_url': src
                        })
                except Exception as e:
                    print(f"Error processing image: {e}")
        
        # Remove duplicates
        unique_cards = {}
        for card in cards_data:
            unique_cards[card['image_url']] = card
        cards_data = list(unique_cards.values())
        
        print(f"Found {len(cards_data)} unique card images")
        return cards_data
    
    def download_card_images(self, cards_data):
        """Download all card images from the scraped data"""
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
                time.sleep(1)  # Be nice to the server
                
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
    scraper = DreambornScraper(headless=False)  # Set to True to hide browser
    
    try:
        # Scrape Fable set page
        set_url = "https://dreamborn.ink/cards?setId=009"  # Fable Set 9
        cards_data = scraper.scrape_set_page(set_url)
        
        if cards_data:
            scraper.download_card_images(cards_data)
        else:
            print("ERROR No card data found. Check the CSS selectors.")
    
    finally:
        scraper.close()

if __name__ == "__main__":
    main()