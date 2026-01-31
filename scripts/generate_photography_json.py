import json
import os
import subprocess
from pathlib import Path
from typing import Dict, List, Any, Optional

from PIL import Image


PHOTOS_DIR = Path("public/images/photos")
OUTPUT_JSON = Path("public/data/photography.json")


def generate_entry(file_name: str, metadata: Dict[str, str]) -> Dict[str, Any]:
    return {
        "header": file_name,
        "image": file_name,
        "metadata": metadata,
    }


def get_orientation(image_path: Path) -> str:
    with Image.open(image_path) as image:
        width, height = image.size

    if height > width:
        return "Portraits"

    return "Landscapes"


def safe_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def format_aperture(value: Any) -> str:
    value_text = safe_text(value)
    if value_text == "":
        return ""
    if value_text.lower().startswith("f/"):
        return value_text
    return f"f/{value_text}"


def build_metadata_from_exif(exif_payload: Dict[str, Any]) -> Dict[str, str]:
    shutter_speed = safe_text(exif_payload.get("ExposureTime") or exif_payload.get("ShutterSpeed"))
    aperture = format_aperture(exif_payload.get("FNumber") or exif_payload.get("Aperture"))
    iso_value = safe_text(exif_payload.get("ISO"))
    created_date_time = safe_text(exif_payload.get("DateTimeOriginal") or exif_payload.get("CreateDate"))
    camera_model = safe_text(exif_payload.get("CameraModelName") or exif_payload.get("Model"))
    lens_model = safe_text(exif_payload.get("LensModel") or exif_payload.get("Lens"))

    metadata = {
        "shutterSpeed": shutter_speed,
        "aperture": aperture,
        "iso": iso_value,
        "createdDateTime": created_date_time,
        "cameraModel": camera_model,
        "lensModel": lens_model,
    }

    return {key: value for key, value in metadata.items() if value != ""}


def run_exiftool_batch(image_paths: List[Path]) -> Dict[str, Dict[str, Any]]:
    if len(image_paths) == 0:
        return {}

    requested_tags = [
        "-FileName",
        "-ExposureTime",
        "-ShutterSpeed",
        "-FNumber",
        "-Aperture",
        "-ISO",
        "-DateTimeOriginal",
        "-CreateDate",
        "-CameraModelName",
        "-Model",
        "-LensModel",
        "-Lens",
    ]

    process = subprocess.run(
        ["exiftool", "-j", "-charset", "filename=utf8", *requested_tags, *[str(path) for path in image_paths]],
        capture_output=True,
        text=True,
        check=False,
    )

    if process.returncode != 0:
        return {}

    try:
        parsed_payload = json.loads(process.stdout)
    except Exception:
        return {}

    if isinstance(parsed_payload, list) is False:
        return {}

    mapped_by_file_name: Dict[str, Dict[str, Any]] = {}

    for item in parsed_payload:
        if isinstance(item, dict) is False:
            continue

        file_name = safe_text(item.get("FileName"))
        if file_name == "":
            continue

        mapped_by_file_name[file_name] = item

    return mapped_by_file_name


def main() -> None:
    if PHOTOS_DIR.exists() is False:
        raise RuntimeError(f"Photos directory not found: {PHOTOS_DIR}")

    image_paths = sorted([path for path in PHOTOS_DIR.glob("*.webp") if path.is_file()], key=lambda p: p.name.lower())

    exif_by_file_name = run_exiftool_batch(image_paths)

    portraits: List[Dict[str, Any]] = []
    landscapes: List[Dict[str, Any]] = []

    for image_path in image_paths:
        file_name = image_path.name
        bucket = get_orientation(image_path)

        exif_payload = exif_by_file_name.get(file_name, {})
        metadata = build_metadata_from_exif(exif_payload)

        entry = generate_entry(file_name, metadata)

        if bucket == "Portraits":
            portraits.append(entry)
        else:
            landscapes.append(entry)

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
