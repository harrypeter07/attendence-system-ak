import os
from PIL import Image, ImageDraw

def create_attendly_icon(size):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Scale factors
    scale = size / 180.0
    radius = int(42 * scale)
    
    # Draw rounded rectangle (Attendly purple #6558ee -> RGB: 101, 88, 238)
    bg_color = (101, 88, 238, 255)
    
    # Use rounded_rectangle
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=bg_color)
    
    # Draw white lightning bolt in center
    # Original coordinates on 180x180:
    # M100 28L42 100H92L80 152L138 80H88L100 28Z
    points = [
        (int(100 * scale), int(28 * scale)),
        (int(42 * scale), int(100 * scale)),
        (int(92 * scale), int(100 * scale)),
        (int(80 * scale), int(152 * scale)),
        (int(138 * scale), int(80 * scale)),
        (int(88 * scale), int(80 * scale)),
    ]
    draw.polygon(points, fill=(255, 255, 255, 255))
    
    return img

# Generate icons
icon_180 = create_attendly_icon(180)
icon_64 = create_attendly_icon(64)
icon_32 = create_attendly_icon(32)
icon_16 = create_attendly_icon(16)

# Save PNGs in public/
icon_180.save('public/apple-icon.png', 'PNG')
icon_32.save('public/icon-light-32x32.png', 'PNG')
icon_32.save('public/icon-dark-32x32.png', 'PNG')

# Save ICO with multiple resolutions in public/ and app/
icon_180.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
icon_180.save('app/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

print('Favicons and PNG icons generated successfully!')
