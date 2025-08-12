import os
from PIL import Image

# Current directory
IMAGE_DIR = "."

def classify_images():
    portrait_list = []
    landscape_list = []

    for fname in os.listdir(IMAGE_DIR):
        path = os.path.join(IMAGE_DIR, fname)
        if not os.path.isfile(path):
            continue

        try:
            with Image.open(path) as img:
                width, height = img.size
                exif = img._getexif()
                orientation = exif.get(274) if exif else None
                if orientation in [5, 6, 7, 8]:
                    width, height = height, width

                entry = {
                    "header": fname,
                    "image": fname
                }

                if height > width:
                    portrait_list.append(entry)
                else:
                    landscape_list.append(entry)
        except Exception as e:
            print(f"Skipping {fname}: {e}")

    return portrait_list, landscape_list

if __name__ == "__main__":
    portraits, landscapes = classify_images()

    print("\nPortrait images:")
    for p in portraits:
        print(f'{{ "header": "{p["header"]}", "image": "{p["image"]}" }},')

    print("\nLandscape images:")
    for l in landscapes:
        print(f'{{ "header": "{l["header"]}", "image": "{l["image"]}" }},')
