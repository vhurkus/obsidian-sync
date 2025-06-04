#!/usr/bin/env python3
"""
PWA Icon Generator for ObsidianSync
Generates PNG icons from SVG in multiple sizes
"""

import os
import subprocess
from pathlib import Path

# Icon sizes needed for PWA
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# Color scheme
BACKGROUND_COLOR = "#0f172a"  # Dark slate
ACCENT_COLOR = "#3b82f6"      # Blue

def create_svg_icon(size: int) -> str:
    """Create SVG icon content for given size"""
    
    # Calculate proportional values
    text_y_start = size * 0.3
    line_height = size * 0.125
    line_width = size * 0.5
    short_line_width = size * 0.375
    
    # Circle positions and radius
    circle_radius = size * 0.03
    circle_x = size * 0.78
    
    svg_content = f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="{size}" height="{size}" rx="{size * 0.15}" fill="{BACKGROUND_COLOR}"/>
  
  <!-- Note lines -->
  <rect x="{size * 0.25}" y="{text_y_start}" width="{line_width}" height="{size * 0.06}" fill="white" opacity="0.9"/>
  <rect x="{size * 0.25}" y="{text_y_start + line_height}" width="{short_line_width}" height="{size * 0.06}" fill="white" opacity="0.7"/>
  <rect x="{size * 0.25}" y="{text_y_start + line_height * 2}" width="{line_width}" height="{size * 0.06}" fill="white" opacity="0.9"/>
  <rect x="{size * 0.25}" y="{text_y_start + line_height * 3}" width="{short_line_width * 0.8}" height="{size * 0.06}" fill="white" opacity="0.7"/>
  
  <!-- Status dots -->
  <circle cx="{circle_x}" cy="{text_y_start + line_height * 0.5}" r="{circle_radius}" fill="#3b82f6"/>
  <circle cx="{circle_x}" cy="{text_y_start + line_height * 1.5}" r="{circle_radius}" fill="#10b981"/>
  <circle cx="{circle_x}" cy="{text_y_start + line_height * 2.5}" r="{circle_radius}" fill="#f59e0b"/>
</svg>'''
    
    return svg_content

def generate_icons():
    """Generate PNG icons from SVG using librsvg or inkscape"""
    
    icons_dir = Path("public/icons")
    icons_dir.mkdir(exist_ok=True)
    
    print("🎨 Generating PWA icons for ObsidianSync...")
    
    for size in SIZES:
        print(f"📱 Creating {size}x{size} icon...")
        
        # Create SVG content
        svg_content = create_svg_icon(size)
        svg_path = icons_dir / f"icon-{size}x{size}.svg"
        png_path = icons_dir / f"icon-{size}x{size}.png"
        
        # Write SVG file
        with open(svg_path, 'w') as f:
            f.write(svg_content)
        
        # Convert to PNG using available tools
        success = False
        
        # Try rsvg-convert (most common)
        try:
            subprocess.run([
                'rsvg-convert', 
                '-w', str(size), 
                '-h', str(size), 
                '-o', str(png_path), 
                str(svg_path)
            ], check=True, capture_output=True)
            success = True
            print(f"  ✅ Generated with rsvg-convert")
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass
        
        # Try inkscape as fallback
        if not success:
            try:
                subprocess.run([
                    'inkscape', 
                    str(svg_path), 
                    '--export-width', str(size),
                    '--export-height', str(size),
                    '--export-filename', str(png_path)
                ], check=True, capture_output=True)
                success = True
                print(f"  ✅ Generated with inkscape")
            except (subprocess.CalledProcessError, FileNotFoundError):
                pass
        
        # Try ImageMagick convert as last resort
        if not success:
            try:
                subprocess.run([
                    'convert', 
                    '-background', 'transparent',
                    '-size', f'{size}x{size}',
                    str(svg_path), 
                    str(png_path)
                ], check=True, capture_output=True)
                success = True
                print(f"  ✅ Generated with ImageMagick")
            except (subprocess.CalledProcessError, FileNotFoundError):
                pass
        
        if not success:
            print(f"  ❌ Failed to generate {size}x{size} PNG")
            print(f"     SVG saved as: {svg_path}")
        else:
            # Remove temporary SVG
            svg_path.unlink()
    
    print("\n🎉 Icon generation complete!")
    print(f"📂 Icons saved in: {icons_dir.absolute()}")
    
    # List generated files
    png_files = list(icons_dir.glob("*.png"))
    if png_files:
        print(f"📱 Generated {len(png_files)} PNG icons:")
        for png_file in sorted(png_files):
            file_size = png_file.stat().st_size
            print(f"   {png_file.name} ({file_size} bytes)")
    else:
        print("⚠️  No PNG files generated. You may need to install:")
        print("   - rsvg-convert: sudo apt install librsvg2-bin")
        print("   - inkscape: sudo apt install inkscape")
        print("   - ImageMagick: sudo apt install imagemagick")

if __name__ == "__main__":
    generate_icons()
