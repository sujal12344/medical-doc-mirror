#!/usr/bin/env python3

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


# ============================================================
# CONFIG
# ============================================================

# Expected placeholder format:
# {{placeholder_name}}
PLACEHOLDER_PATTERN = re.compile(r"\{\s*([A-Za-z0-9_.\-]+)\s*\}")


# WordprocessingML namespace
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}


# ============================================================
# DOCX EXTRACTION
# ============================================================

def extract_text_from_docx(docx_path: Path) -> str:
    """
    Extract text from paragraphs inside a .docx file.

    We read the underlying XML directly so placeholders that are
    split across multiple Word runs can still be detected.
    """

    text_parts = []

    with zipfile.ZipFile(docx_path, "r") as z:
        # All Word XML files that can contain visible text.
        xml_files = [
            name
            for name in z.namelist()
            if (
                name.startswith("word/")
                and name.endswith(".xml")
                and (
                    name == "word/document.xml"
                    or name.startswith("word/header")
                    or name.startswith("word/footer")
                    or name in {
                        "word/footnotes.xml",
                        "word/endnotes.xml",
                        "word/comments.xml",
                    }
                )
            )
        ]

        for xml_file in xml_files:
            try:
                root = ET.fromstring(z.read(xml_file))
            except ET.ParseError:
                continue

            # Process every Word paragraph separately.
            # This prevents text from unrelated paragraphs being
            # accidentally joined into one placeholder.
            for paragraph in root.findall(".//w:p", NS):
                parts = []

                for text_node in paragraph.findall(".//w:t", NS):
                    if text_node.text:
                        parts.append(text_node.text)

                if parts:
                    text_parts.append("".join(parts))

    return "\n".join(text_parts)


def extract_placeholders_from_docx(docx_path: Path) -> set[str]:
    """
    Extract unique placeholder names from one DOCX.
    """

    text = extract_text_from_docx(docx_path)

    matches = PLACEHOLDER_PATTERN.findall(text)

    # Normalize whitespace and remove duplicates.
    placeholders = {
        match.strip()
        for match in matches
        if match.strip()
    }

    return placeholders


# ============================================================
# MD FORM PROCESSING
# ============================================================

def process_md_folder(md_folder: Path):
    """
    Scan one md-* directory and create placeholders.json.
    """

    docx_files = sorted(md_folder.rglob("*.docx"))

    all_placeholders = set()
    template_placeholders = {}

    for docx_file in docx_files:
        try:
            placeholders = extract_placeholders_from_docx(docx_file)

            relative_path = str(
                docx_file.relative_to(md_folder)
            ).replace("\\", "/")

            template_placeholders[relative_path] = sorted(placeholders)
            all_placeholders.update(placeholders)

            print(
                f"  ✓ {docx_file.name}: "
                f"{len(placeholders)} placeholders"
            )

        except Exception as exc:
            print(
                f"  ✗ Failed: {docx_file}\n"
                f"    {exc}",
                file=sys.stderr
            )

    # md-22 -> md_form = md-22
    md_form = md_folder.name

    result = {
        "md_form": md_form,
        "placeholders": sorted(all_placeholders),
        "templates": template_placeholders,
    }

    output_file = md_folder / "placeholders.json"

    with output_file.open("w", encoding="utf-8") as f:
        json.dump(
            result,
            f,
            indent=2,
            ensure_ascii=False
        )
        f.write("\n")

    print(
        f"  → {output_file} "
        f"({len(all_placeholders)} unique placeholders)"
    )


# ============================================================
# MAIN
# ============================================================

def main():
    # Default:
    # current_directory/format
    project_root = Path.cwd()

    format_dir = project_root / "format"

    # Allow custom format path:
    #
    # python extract_placeholders.py ./format
    if len(sys.argv) > 1:
        format_dir = Path(sys.argv[1]).resolve()

    if not format_dir.exists():
        print(
            f"ERROR: Format directory not found:\n"
            f"{format_dir}",
            file=sys.stderr
        )
        sys.exit(1)

    if not format_dir.is_dir():
        print(
            f"ERROR: Not a directory:\n"
            f"{format_dir}",
            file=sys.stderr
        )
        sys.exit(1)

    # Find md-* directories only.
    md_folders = sorted(
        folder
        for folder in format_dir.iterdir()
        if folder.is_dir()
        and folder.name.lower().startswith("md-")
    )

    if not md_folders:
        print(
            f"No md-* folders found inside:\n{format_dir}"
        )
        return

    print(f"Scanning: {format_dir}\n")

    for md_folder in md_folders:
        print(f"[{md_folder.name}]")
        process_md_folder(md_folder)
        print()

    print("Done.")


if __name__ == "__main__":
    main()