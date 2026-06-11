from PIL import Image
import sys
import os

images = ["coal-clean.png", "iron-clean.png", "wood-clean.png", "farm-clean.png"]

for img_name in images:
    if not os.path.exists(img_name):
        continue
    img = Image.open(img_name).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    # Analyze middle pixel just in case
    width, height = img.size
    middle = img.getpixel((10, height//2))
    print(f"{img_name} pixel at x=10: {middle}")
    
    # We want to remove the brownish background #f4ebd8 (244, 235, 216)
    bg_color = (244, 235, 216)
    
    for item in data:
        # Distance to brown bg
        # Allowing some tolerance because of anti-aliasing
        dist = abs(item[0] - bg_color[0]) + abs(item[1] - bg_color[1]) + abs(item[2] - bg_color[2])
        if dist < 30 and item[3] > 100:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save("nobg_" + img_name)
    print(f"Saved nobg_{img_name}")
