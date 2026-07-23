import json, sys
from PIL import Image
from pathlib import Path

OUT = Path('/tmp/opencode/runtime/visual-pixel')

def lum(rgb):
    def to_lin(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * to_lin(rgb[0]) + 0.7152 * to_lin(rgb[1]) + 0.0722 * to_lin(rgb[2])

def cr(a, b):
    l1, l2 = lum(a), lum(b)
    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

# Load walker summary
data = json.load(open('/tmp/opencode/runtime/visual-pixel-summary.json'))

results = []
for r in data['results']:
    if 'error' in r:
        continue
    fp = r['fullPath']
    img = Image.open(fp)
    # Crop the element region
    x, y, w, h = r['x'], r['y'], r['w'], r['h']
    pad = 6
    safeX = max(0, x - pad)
    safeY = max(0, y - pad)
    cropW = min(img.width - safeX, w + pad * 2)
    cropH = min(img.height - safeY, h + pad * 2)
    if cropW < 4 or cropH < 4:
        continue
    crop = img.crop((safeX, safeY, safeX + cropW, safeY + cropH))
    # Save crop for inspection
    cropFile = str(OUT / f"{r['routeId']}_{r['viewport']}_crop_{results.__len__():03d}.png")
    crop.save(cropFile)
    # Sample pixels: find the most extreme (lightest vs darkest) pixel as the glyph
    # The text is either lighter or darker than its background
    pixels = list(crop.getdata())
    # Filter out fully transparent
    pixels = [(p[:3] if len(p) >= 3 else p) for p in pixels]
    # Find darkest and lightest pixels
    darkest = min(pixels, key=lambda p: sum(p[:3]))
    lightest = max(pixels, key=lambda p: sum(p[:3]))
    # Average of the 4 corners (most likely bg, away from text)
    corners = [
        pixels[0],
        pixels[min(len(pixels) - 1, cropW - 1)],
        pixels[len(pixels) - cropW],
        pixels[len(pixels) - 1],
    ]
    # Corner avg = bg candidate
    avg_r = sum(c[0] for c in corners) // 4
    avg_g = sum(c[1] for c in corners) // 4
    avg_b = sum(c[2] for c in corners) // 4
    bg = (avg_r, avg_g, avg_b)
    # Compare dark pixel vs bg, light pixel vs bg
    contrast_dark = cr(darkest, bg)
    contrast_light = cr(lightest, bg)
    actual_contrast = max(contrast_dark, contrast_light)
    results.append({
        'route': r['route'],
        'viewport': r['viewport'],
        'tag': r['tag'],
        'text': r['text'][:50],
        'walkerRatio': r['walkerRatio'],
        'walkerFg': r['walkerFg'],
        'walkerBg': r['walkerBg'],
        'darkestPx': darkest,
        'lightestPx': lightest,
        'bgPx': bg,
        'actualContrast': round(actual_contrast, 2),
        'verdict': 'REAL' if actual_contrast < 4.5 else 'FP',
    })

# Summary
real = [r for r in results if r['verdict'] == 'REAL']
fp = [r for r in results if r['verdict'] == 'FP']
print(f'TOTAL: {len(results)}')
print(f'REAL low contrast (<4.5): {len(real)}')
print(f'FALSE POSITIVES (>=4.5): {len(fp)}')
print()
if real:
    print('=== REAL ISSUES ===')
    for r in real:
        print(f"  {r['route']}@{r['viewport']} ratio={r['actualContrast']} {r['tag']} '{r['text']}'")
if fp:
    print()
    print('=== TOP FALSE POSITIVES ===')
    for r in sorted(fp, key=lambda x: x['actualContrast'])[:20]:
        print(f"  {r['route']}@{r['viewport']} actual={r['actualContrast']} walker={r['walkerRatio']} '{r['text'][:30]}'")

with open('/tmp/opencode/runtime/visual-pixel-verdict.json', 'w') as f:
    json.dump({'summary': {
        'total': len(results),
        'real': len(real),
        'falsePositives': len(fp),
    }, 'results': results}, f, indent=2)
