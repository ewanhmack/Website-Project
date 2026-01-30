import json
import os
from pathlib import Path
from PIL import Image

PHOTOS_DIR = Path("public/images/photos")
OUTPUT_JSON = Path("public/data/photography.json")


def generate_entry(file_name: str) -> dict:
    return {
        "header": file_name,
        "image": file_name
    }


def get_orientation(image_path: Path) -> str:
    with Image.open(image_path) as image:
        width, height = image.size

    if height > width:
        return "Portraits"

    return "Landscapes"


def main() -> None:
    if not PHOTOS_DIR.exists():
        raise RuntimeError(f"Photos directory not found: {PHOTOS_DIR}")

    portraits = []
    landscapes = []

    for image_path in PHOTOS_DIR.glob("*.webp"):
        file_name = image_path.name
        bucket = get_orientation(image_path)

        if bucket == "Portraits":
            portraits.append(generate_entry(file_name))
        else:
            landscapes.append(generate_entry(file_name))

    payload = {
        "Portraits": portraits,
        "Landscapes": landscapes
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_JSON.open("w", encoding="utf-8") as output_file:
        json.dump(payload, output_file, indent=2)
        output_file.write("\n")


if __name__ == "__main__":
    main()
