#!/usr/bin/env python3
"""
Test various Lorcana APIs to find working sources
"""

import requests

def test_api(name, url, headers=None):
    try:
        response = requests.get(url, headers=headers or {}, timeout=10)
        print(f"OK {name}: {response.status_code} - {len(response.text)} chars")
        return response.status_code == 200
    except Exception as e:
        print(f"FAIL {name}: {e}")
        return False

def main():
    print("Testing Lorcana API sources...\n")
    
    apis = [
        ("Lorcana API", "https://api.lorcana-api.com/cards/all"),
        ("Dreamborn API", "https://dreamborn.ink/api/cards"),
        ("LorcanaHQ API", "https://lorcana-hq.com/api/cards"),
        ("Community API", "https://lorcana-cards.herokuapp.com/api/cards"),
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    working_apis = []
    for name, url in apis:
        if test_api(name, url, headers):
            working_apis.append((name, url))
    
    print(f"\nResult: {len(working_apis)} working APIs found")
    for name, url in working_apis:
        print(f"  - {name}: {url}")

if __name__ == "__main__":
    main()