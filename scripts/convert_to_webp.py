#!/usr/bin/env python3
"""
Convert Fabled card images from JPG to WebP format
"""

import os
from pathlib import Path
from PIL import Image

def convert_jpg_to_webp():
    """Convert all 009-XXX.jpg files to 009-XXX.webp"""
    
    image_dir = Path("../tools/lorcana-mulligan/assets/images/cards")
    
    # Find all 009-XXX.jpg files
    jpg_files = list(image_dir.glob("009-*.jpg"))
    print(f"Found {len(jpg_files)} JPG files to convert")
    
    if not jpg_files:
        print("No 009-XXX.jpg files found!")
        return False
    
    converted_count = 0
    failed_count = 0
    
    for jpg_file in jpg_files:
        try:
            # Create webp filename
            webp_file = jpg_file.with_suffix('.webp')
            
            # Skip if webp already exists
            if webp_file.exists():
                print(f"Skipped: {webp_file.name} already exists")
                continue
            
            # Convert JPG to WebP
            with Image.open(jpg_file) as img:
                # Convert to RGB if needed (WebP doesn't support RGBA with quality setting)
                if img.mode in ('RGBA', 'LA'):
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = rgb_img
                
                # Save as WebP with good quality
                img.save(webp_file, 'WEBP', quality=85, optimize=True)
            
            print(f"Converted: {jpg_file.name} -> {webp_file.name}")
            converted_count += 1
            
        except Exception as e:
            print(f"Failed to convert {jpg_file.name}: {e}")
            failed_count += 1
    
    print(f"\nConversion complete!")
    print(f"Successfully converted: {converted_count} files")
    print(f"Failed: {failed_count} files")
    
    return converted_count > 0

def update_card_image_mapping():
    """Update cardImageMap.js to use .webp extensions"""
    
    map_file = Path("../tools/lorcana-mulligan/data/cardImageMap.js")
    
    if not map_file.exists():
        print("cardImageMap.js not found")
        return False
    
    try:
        with open(map_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace all .jpg with .webp in the Fabled card mappings
        updated_content = content.replace('009-', '009-').replace('.jpg"', '.webp"')
        
        # Count replacements
        jpg_count = content.count('/009-') - updated_content.count('.jpg"')
        
        if jpg_count > 0:
            with open(map_file, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            print(f"Updated cardImageMap.js: {jpg_count} entries changed to .webp")
            return True
        else:
            print("No .jpg entries found to update in cardImageMap.js")
            return True
            
    except Exception as e:
        print(f"Error updating cardImageMap.js: {e}")
        return False

def main():
    print("Converting Fabled card images from JPG to WebP...")
    
    # Check if PIL is available
    try:
        from PIL import Image
    except ImportError:
        print("ERROR: PIL (Pillow) is not installed!")
        print("Install with: pip install Pillow")
        return
    
    if convert_jpg_to_webp():
        print("\nUpdating cardImageMap.js...")
        if update_card_image_mapping():
            print("SUCCESS: All Fabled cards converted to WebP format!")
        else:
            print("Image conversion successful, but cardImageMap.js update failed")
    else:
        print("Image conversion failed!")

if __name__ == "__main__":
    main()