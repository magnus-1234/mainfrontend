from PIL import Image
import sys
import os

images = ["coal-clean.png", "iron-clean.png", "wood-clean.png", "farm-clean.png"]

for img_name in images:
    if not os.path.exists(img_name):
        print(f"Skipping {img_name}")
        continue
    img = Image.open(img_name).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    # Let's get the color of the top-left pixel
    width, height = img.size
    top_left = img.getpixel((0, 0))
    print(f"{img_name} top-left pixel: {top_left}")
    
    for item in data:
        # Check if the pixel is close to the top-left color
        # top_left is like (244, 235, 216, 255)
        if abs(item[0] - top_left[0]) < 10 and abs(item[1] - top_left[1]) < 10 and abs(item[2] - top_left[2]) < 10 and item[3] > 200:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    img.save("fixed_" + img_name)
    print(f"Saved fixed_{img_name}")
