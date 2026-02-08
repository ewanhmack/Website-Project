import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image, ImageOps

PHOTOS_DIR = Path("public/images/photos")
OUTPUT_JSON = Path("public/data/photography.json")
PR_BODY_PATH = Path(".github/photography-pr-body.md")

SUPPORTED_SOURCE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
SUPPORTED_WEBP_EXTENSION = ".webp"

DELETE_SOURCE_FILES_AFTER_CONVERSION = True
WEBP_QUALITY = 92


@dataclass(frozen=True)
class PhotoMetadata:
    shutter_speed: Optional[str]
    aperture: Optional[str]
    iso: Optional[str]
    created_date_time: Optional[str]
    lens_model: Optional[str]

    def to_payload(self) -> Dict[str, str]:
        payload: Dict[str, str] = {}

        if isinstance(self.shutter_speed, str) and self.shutter_speed:
            payload["shutterSpeed"] = self.shutter_speed

        if isinstance(self.aperture, str) and self.aperture:
            payload["aperture"] = self.aperture

        if isinstance(self.iso, str) and self.iso:
            payload["iso"] = self.iso

        if isinstance(self.created_date_time, str) and self.created_date_time:
            payload["createdDateTime"] = self.created_date_time

        if isinstance(self.lens_model, str) and self.lens_model:
            payload["lensModel"] = self.lens_model

        return payload


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


def get_orientation_bucket(image_path: Path) -> str:
    with Image.open(image_path) as image:
        image = ImageOps.exif_transpose(image)
        width, height = image.size

    if height > width:
        return "Portraits"

    return "Landscapes"


def run_exiftool_json(image_path: Path) -> Dict[str, Any]:
    process = subprocess.run(
        ["exiftool", "-json", "-n", str(image_path)],
        capture_output=True,
        text=True,
        check=False,
    )

    if process.returncode != 0:
        stderr_text = process.stderr.strip()
        raise RuntimeError(f"exiftool failed for {image_path.name}: {stderr_text}")

    parsed = json.loads(process.stdout)
    if isinstance(parsed, list) is False or len(parsed) == 0:
        return {}

    first = parsed[0]
    if isinstance(first, dict) is False:
        return {}

    return first


def strip_trailing_zeros(number_text: str) -> str:
    if "." not in number_text:
        return number_text

    stripped = number_text.rstrip("0").rstrip(".")
    if stripped == "":
        return number_text

    return stripped


def format_shutter_speed(exif: Dict[str, Any]) -> Optional[str]:
    exposure_time = exif.get("ExposureTime")
    if exposure_time is not None:
        if isinstance(exposure_time, (int, float)):
            return strip_trailing_zeros(str(exposure_time))
        if isinstance(exposure_time, str) and exposure_time.strip():
            return exposure_time.strip()

    shutter_speed_value = exif.get("ShutterSpeedValue")
    if isinstance(shutter_speed_value, (int, float)):
        return strip_trailing_zeros(str(shutter_speed_value))

    return None


def format_aperture(exif: Dict[str, Any]) -> Optional[str]:
    f_number = exif.get("FNumber")
    if f_number is None:
        f_number = exif.get("ApertureValue")

    if isinstance(f_number, (int, float)):
        return f"f/{strip_trailing_zeros(str(f_number))}"

    if isinstance(f_number, str) and f_number.strip():
        cleaned = f_number.strip()
        if cleaned.startswith("f/"):
            return cleaned
        return f"f/{cleaned}"

    return None


def format_iso(exif: Dict[str, Any]) -> Optional[str]:
    iso_value = exif.get("ISO")
    if isinstance(iso_value, (int, float)):
        return strip_trailing_zeros(str(iso_value))

    if isinstance(iso_value, str) and iso_value.strip():
        return iso_value.strip()

    return None


def format_created_date_time(exif: Dict[str, Any]) -> Optional[str]:
    for key in ["DateTimeOriginal", "CreateDate", "ModifyDate"]:
        value = exif.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def format_lens_model(exif: Dict[str, Any]) -> Optional[str]:
    for key in ["LensModel", "LensID", "LensSpec"]:
        value = exif.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def read_photo_metadata(image_path: Path) -> PhotoMetadata:
    exif = run_exiftool_json(image_path)

    return PhotoMetadata(
        shutter_speed=format_shutter_speed(exif),
        aperture=format_aperture(exif),
        iso=format_iso(exif),
        created_date_time=format_created_date_time(exif),
        lens_model=format_lens_model(exif),
    )


def convert_to_webp(source_path: Path) -> Tuple[Path, bool]:
    output_path = source_path.with_suffix(SUPPORTED_WEBP_EXTENSION)

    if output_path.exists() is True:
        return output_path, False

    with Image.open(source_path) as image:
        image = ImageOps.exif_transpose(image)

        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")

        image.save(output_path, format="WEBP", quality=WEBP_QUALITY, method=6)

    return output_path, True


def find_source_images() -> List[Path]:
    source_images: List[Path] = []

    for candidate in sorted(PHOTOS_DIR.glob("*"), key=lambda path_item: path_item.name.lower()):
        if candidate.is_file() is False:
            continue

        extension = candidate.suffix.lower()
        if extension in SUPPORTED_SOURCE_EXTENSIONS:
            source_images.append(candidate)

    return source_images


def find_webp_images() -> List[Path]:
    webp_images: List[Path] = []

    for candidate in sorted(PHOTOS_DIR.glob(f"*{SUPPORTED_WEBP_EXTENSION}"), key=lambda path_item: path_item.name.lower()):
        if candidate.is_file() is False:
            continue

        webp_images.append(candidate)

    return webp_images


def merge_metadata(existing_metadata: Dict[str, Any], new_metadata: Dict[str, str]) -> Dict[str, Any]:
    merged = dict(existing_metadata)

    for key, value in new_metadata.items():
        if key in merged:
            existing_value = merged.get(key)
            if isinstance(existing_value, str) and existing_value.strip():
                continue

        merged[key] = value

    return merged


def build_entry(file_name: str, metadata_payload: Dict[str, str]) -> Dict[str, Any]:
    return {
        "header": file_name,
        "image": file_name,
        "metadata": metadata_payload,
    }


def upsert_record(
    records: List[Dict[str, Any]],
    file_name: str,
    metadata_payload: Dict[str, str],
) -> bool:
    for index, existing_record in enumerate(records):
        shaped = ensure_record_shape(existing_record)
        if shaped["image"] != file_name:
            continue

        merged_metadata = merge_metadata(shaped["metadata"], metadata_payload)
        records[index] = {
            "header": shaped["header"] or file_name,
            "image": file_name,
            "metadata": merged_metadata,
        }
        return False

    records.append(build_entry(file_name, metadata_payload))
    return True


def write_pr_body(
    processed_conversions: List[Tuple[str, str, bool]],
    updated_webps: List[str],
) -> None:
    PR_BODY_PATH.parent.mkdir(parents=True, exist_ok=True)

    lines: List[str] = []
    lines.append("Automated photo processing\n")
    lines.append("Changes in this PR:\n")

    if len(processed_conversions) > 0:
        lines.append("### Conversions\n")
        for source_name, webp_name, source_deleted in processed_conversions:
            deletion_note = "deleted source" if source_deleted else "kept source"
            lines.append(f"- `{source_name}` → `{webp_name}` ({deletion_note})\n")
        lines.append("\n")

    if len(updated_webps) > 0:
        lines.append("### photography.json entries updated/added for\n")
        for webp_name in updated_webps:
            lines.append(f"- `{webp_name}`\n")
        lines.append("\n")

    if len(processed_conversions) == 0 and len(updated_webps) == 0:
        lines.append("- No photo changes detected\n")

    with PR_BODY_PATH.open("w", encoding="utf-8") as output_file:
        output_file.writelines(lines)


def main() -> None:
    if PHOTOS_DIR.exists() is False:
        raise RuntimeError(f"Photos directory not found: {PHOTOS_DIR}")

    existing_payload = load_existing_payload()

    portraits: List[Dict[str, Any]] = [ensure_record_shape(item) for item in existing_payload["Portraits"]]
    landscapes: List[Dict[str, Any]] = [ensure_record_shape(item) for item in existing_payload["Landscapes"]]

    processed_conversions: List[Tuple[str, str, bool]] = []
    updated_webps: List[str] = []

    for source_path in find_source_images():
        metadata = read_photo_metadata(source_path)
        webp_path, created_webp = convert_to_webp(source_path)

        source_deleted = False
        if created_webp is True and DELETE_SOURCE_FILES_AFTER_CONVERSION is True:
            try:
                source_path.unlink()
                source_deleted = True
            except OSError:
                source_deleted = False

        if created_webp is True or source_deleted is True:
            processed_conversions.append((source_path.name, webp_path.name, source_deleted))

        bucket = get_orientation_bucket(webp_path)
        metadata_payload = metadata.to_payload()

        if bucket == "Portraits":
            upsert_record(portraits, webp_path.name, metadata_payload)
        else:
            upsert_record(landscapes, webp_path.name, metadata_payload)

        updated_webps.append(webp_path.name)

    for webp_path in find_webp_images():
        bucket = get_orientation_bucket(webp_path)

        created_new_record = False
        if bucket == "Portraits":
            created_new_record = upsert_record(portraits, webp_path.name, {})
        else:
            created_new_record = upsert_record(landscapes, webp_path.name, {})

        if created_new_record is True:
            updated_webps.append(webp_path.name)

    updated_webps = sorted(set(updated_webps), key=lambda name: name.lower())

    payload = {
        "Portraits": portraits,
        "Landscapes": landscapes,
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_JSON.open("w", encoding="utf-8") as output_file:
        json.dump(payload, output_file, indent=2, ensure_ascii=False)
        output_file.write("\n")

    write_pr_body(processed_conversions=processed_conversions, updated_webps=updated_webps)


if __name__ == "__main__":
    main()
