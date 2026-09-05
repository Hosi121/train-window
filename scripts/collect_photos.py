"""Refresh licensed Commons photographs and the color data used by the window.

Requires Python 3.10+, Pillow, requests. Sources are pinned in photo-sources.json.
Ordinary app builds use the committed files and never contact Wikimedia.
"""
from pathlib import Path
from io import BytesIO
from html import unescape
from collections import Counter
import json
import re
import time
import requests
from PIL import Image, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parent.parent
HEADERS = {"User-Agent": "YorimichiTrainWindow/1.0 (https://github.com/Hosi121/train-window)"}


def plain(value):
    return unescape(re.sub(r"<[^>]+>", "", value)).strip()


def extract_colors(im):
    # Horizontal order is preserved. Each band contains twelve local row means.
    # The runtime stretches these into streaks, never inventing random colors.
    im = ImageOps.exif_transpose(im).convert("RGB").resize((360, 180), Image.Resampling.BOX)
    quantized = im.quantize(colors=16, method=Image.Quantize.MEDIANCUT, kmeans=3).convert("RGB")
    rows = []
    for y in range(180):
        cells = []
        for x in range(12):
            mean = ImageStat.Stat(im.crop((x * 30, y, (x + 1) * 30, y + 1))).mean
            cells.append("#" + "".join(f"{round(c):02x}" for c in mean))
        # Preserve distinct flower/sign/sky colors that a simple row mean loses.
        common = Counter(quantized.crop((0, y, 360, y + 1)).get_flattened_data()).most_common(2)
        representative = common[min(1 if y % 4 == 0 else 0, len(common) - 1)][0]
        cells[5] = "#" + "".join(f"{c:02x}" for c in representative)
        rows.append(cells)
    colors = sorted(quantized.getcolors(360 * 180), reverse=True)
    chosen = [colors.pop(0)[1]]
    while len(chosen) < 5 and colors:
        def score(item):
            count, rgb = item
            distance = min(sum((a - b) ** 2 for a, b in zip(rgb, selected)) for selected in chosen)
            return count * distance ** .65
        pick = max(colors, key=score)
        chosen.append(pick[1])
        colors.remove(pick)
    palette = ["#" + "".join(f"{c:02x}" for c in color) for color in chosen]
    return rows, palette


def barcode_svg(rows, flat=False):
    rects = []
    for y, row in enumerate(rows):
        height = 360 / len(rows)
        # A single sampled color stretches across each full horizontal band.
        # A few long, low-opacity local streaks supply motion without blocky shapes.
        base = row[5]
        rects.append(f'<rect y="{y * height}" width="1536" height="{height + .1}" fill="{base}"/>')
        if flat:
            continue
        offset = ((y * 2654435761) ^ (y * y * 1597334677)) % 1536
        for shift in [-1536, 0]:
            rects.append(f'<rect x="{offset + shift}" y="{y * height}" width="{420 + y % 6 * 130}" height="{height + .1}" fill="{row[(y * 3) % 12]}" opacity=".16"/>')
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="360" viewBox="0 0 1536 360" preserveAspectRatio="none">' + ''.join(rects) + '</svg>'


def main():
    sources = json.loads((ROOT / "src/data/photo-sources.json").read_text())
    result = {}
    for slug, source in sources.items():
        target = ROOT / f"public/photos/{slug}.webp"
        if target.exists():
            im = Image.open(target)
        else:
            response = None
            for attempt in range(3):
                response = requests.get(source["download"], headers=HEADERS, timeout=45)
                if response.status_code != 429:
                    break
                time.sleep(3 * (attempt + 1))
            response.raise_for_status()
            im = ImageOps.exif_transpose(Image.open(BytesIO(response.content))).convert("RGB")
            im.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
            im.save(target, "WEBP", quality=85, method=6)
            # Extract from the shipped file so that the displayed photograph matches.
            im = Image.open(target)
        rows, palette = extract_colors(im)
        barcode_dir = ROOT / "public/barcodes"
        barcode_dir.mkdir(exist_ok=True)
        for flat in [False, True]:
            suffix = "-flat" if flat else ""
            (barcode_dir / f"{slug}{suffix}.svg").write_text(barcode_svg(rows, flat))
        result[slug] = {**source, "src": f"/photos/{slug}.webp", "width": im.width,
                        "height": im.height, "barcode": f"/barcodes/{slug}.svg",
                        "flatBarcode": f"/barcodes/{slug}-flat.svg", "palette": palette}
        print(f"{slug}: {im.width} x {im.height}, 180 color bands")
    (ROOT / "src/data/photos.json").write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    main()
