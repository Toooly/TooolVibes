#!/usr/bin/env node
// Side-by-side pair: LEFT golden master, RIGHT implementation. Same size/scale.
// Usage: node scripts/ui-workstation/ui-pair.mjs --gm .opencode/golden-masters/01-home.png --impl artifacts/.../shot.png --out artifacts/.../pair.png
import { execSync } from "node:child_process";
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);
const { gm, impl, out } = args;
if (!gm || !impl || !out) { console.error("need --gm --impl --out"); process.exit(1); }
execSync(`python3 -c "
from PIL import Image
gm = Image.open('${gm}').convert('RGB')
im = Image.open('${impl}').convert('RGB')
w = min(gm.width, im.width); h = min(gm.height, im.height)
gm, im = gm.crop((0,0,w,h)), im.crop((0,0,w,h))
pair = Image.new('RGB', (w*2+8, h), (0,0,0))
pair.paste(gm, (0,0)); pair.paste(im, (w+8,0))
pair.save('${out}')
print('${out}', pair.size)
"`);
