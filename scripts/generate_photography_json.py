import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

from PIL import Image


PHOTOS_DIR = Path("public/images/photos")
OUTPUT_JSON = Path("public/data/photography.json")

supported_extension = ".webp"


def generate_entry(file_name: str) -> Dict[str, Any]:
    return {
        "header": file_name,
        "image": file_name,
        "metadata": {},
    }


def get_orientation(image_path: Path) -> str:
    with Image.open(image_path) as image:
        width, height = image.size

    if height > width:
        return "Portraits"

    return "Landscapes"


def load_existing_payload() -> Dict[str, List[Dict[str, Any]]]:
    if OUTPUT_JSON.exists() is False:
        return {"Portraits": [], "Landscapes": []}

    with OUTPUT_JSON.open("r", encoding="utf-8") as existing_file:
        existing_payload = json.load(existing_file)

    if isinstance(existing_payload, dict) is False:
        return {"Portraits": [], "Landscapes": []}

    portraits = existing_payload.get("Portraits")
    landscapes = existing_payload.get("Landscapes")

    if isinstance(portraits, list) is False:
        portraits = []

    if isinstance(landscapes, list) is False:
        landscapes = []

    return {"Portraits": portraits, "Landscapes": landscapes}


def index_existing(payload: Dict[str, List[Dict[str, Any]]]) -> Tuple[Dict[str, str], set]:
    file_name_to_bucket: Dict[str, str] = {}
    file_names: set = set()

    for bucket in ["Portraits", "Landscapes"]:
        for record in payload.get(bucket, []):
            image_name = record.get("image")
            if isinstance(image_name, str) is False:
                continue

            file_name_to_bucket[image_name] = bucket
            file_names.add(image_name)

    return file_name_to_bucket, file_names


def ensure_record_shape(record: Dict[str, Any]) -> Dict[str, Any]:
    header = record.get("header")
    image_name = record.get("image")
    metadata = record.get("metadata")

    if isinstance(header, str) is False:
        header = image_name if isinstance(image_name, str) else ""

    if isinstance(image_name, str) is False:
        image_name = header if isinstance(header, str) else ""

    if isinstance(metadata, dict) is False:
        metadata = {}

    return {
        "header": header,
        "image": image_name,
        "metadata": metadata,
    }


def main() -> None:
    if PHOTOS_DIR.exists() is False:
        raise RuntimeError(f"Photos directory not found: {PHOTOS_DIR}")

    existing_payload = load_existing_payload()
    existing_bucket_by_file, existing_file_names = index_existing(existing_payload)

    portraits: List[Dict[str, Any]] = [ensure_record_shape(item) for item in existing_payload["Portraits"]]
    landscapes: List[Dict[str, Any]] = [ensure_record_shape(item) for item in existing_payload["Landscapes"]]

    for image_path in sorted(PHOTOS_DIR.glob(f"*{supported_extension}"), key=lambda p: p.name.lower()):
        if image_path.is_file() is False:
            continue

        file_name = image_path.name

        if file_name in existing_file_names:
            continue

        bucket = get_orientation(image_path)

        if bucket == "Portraits":
            portraits.append(generate_entry(file_name))
        else:
            landscapes.append(generate_entry(file_name))

    payload = {
        "Portraits": portraits,
        "Landscapes": landscapes,
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_JSON.open("w", encoding="utf-8") as output_file:
        json.dump(payload, output_file, indent=2, ensure_ascii=False)
        output_file.write("\n")


if __name__ == "__main__":
    main()
