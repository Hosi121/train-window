"""Subset OFL-licensed Japanese fonts to the app's own text; no runtime font CDN."""
from pathlib import Path
import requests
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / 'public/fonts'


def main():
    TARGET.mkdir(exist_ok=True)
    text = ''.join(chr(i) for i in range(32, 127))
    for path in (ROOT / 'src').rglob('*'):
        if path.suffix in ['.jsx', '.js', '.json']:
            text += path.read_text()
    text += (ROOT / 'index.html').read_text()
    for family, folder in [('NotoSansJP', 'notosansjp'), ('NotoSerifJP', 'notoserifjp')]:
        url = f'https://raw.githubusercontent.com/google/fonts/main/ofl/{folder}/{family}%5Bwght%5D.ttf'
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        from io import BytesIO
        font = TTFont(BytesIO(response.content))
        options = subset.Options()
        options.flavor = 'woff2'
        options.layout_features = ['*']
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(text=text)
        subsetter.subset(font)
        font.flavor = 'woff2'
        font.save(TARGET / f'{family}.woff2')
        license_response = requests.get(f'https://raw.githubusercontent.com/google/fonts/main/ofl/{folder}/OFL.txt', timeout=30)
        license_response.raise_for_status()
        (TARGET / f'{family}-OFL.txt').write_text(license_response.text)
        print(f'{family}: {(TARGET / f"{family}.woff2").stat().st_size // 1024} KB', flush=True)


if __name__ == '__main__':
    main()
