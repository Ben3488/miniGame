from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = [ROOT / "index.html", *sorted((ROOT / "games").glob("*.html"))]

href_pattern = re.compile(r'href=["\']([^"\']+\.html)["\']')
asset_pattern = re.compile(r"""(?:url\(["']?|img:\s*["'])([^"')]+)""")

missing_hrefs = []
missing_assets = []

for html_file in HTML_FILES:
    text = html_file.read_text(encoding="utf-8")
    for href in href_pattern.findall(text):
        if href.startswith(("http://", "https://", "#")):
            continue
        target = (html_file.parent / href).resolve()
        if not target.exists():
            missing_hrefs.append((html_file.relative_to(ROOT), href))

    for asset in asset_pattern.findall(text):
        if asset.startswith(("http://", "https://", "data:", "#")):
            continue
        if not asset.lower().endswith((".png", ".jpg", ".jpeg", ".svg", ".webp")):
            continue
        target = (html_file.parent / asset).resolve()
        if not target.exists():
            missing_assets.append((html_file.relative_to(ROOT), asset))

print(f"checked_html={len(HTML_FILES)}")
print(f"missing_hrefs={len(missing_hrefs)}")
for source, href in missing_hrefs:
    print(f"  {source}: {href}")

print(f"missing_assets={len(missing_assets)}")
for source, asset in missing_assets:
    print(f"  {source}: {asset}")

raise SystemExit(1 if missing_hrefs or missing_assets else 0)
