/** QA-only localhost server. No production route, session or API. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const files = new Set(['index.html', 'renderer.mjs', 'spike.css', 'data.json']);
const fonts = { 'anton.woff2': '62c97acc3aa63787-s.woff2', 'manrope.woff2': '4c9affa5bc8f420e-s.woff2' };
createServer(async (req, res) => {
  try {
    const name = new URL(req.url, 'http://127.0.0.1').pathname.slice(1) || 'index.html';
    if (name === 'favicon.ico') { res.writeHead(204); res.end(); return; }
    const font = name.startsWith('fonts/') ? fonts[name.slice(6)] : null;
    if (!files.has(name) && !font) { res.writeHead(404); res.end(); return; }
    const path = font ? join(root, '../../..', '.next/static/media', font) : join(root, name);
    const body = await readFile(path);
    const type = font ? 'font/woff2' : name.endsWith('.mjs') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : name.endsWith('.json') ? 'application/json' : 'text/html';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body);
  } catch { res.writeHead(500); res.end('QA file unavailable; run the existing project build to populate local fonts.'); }
}).listen(3130, '127.0.0.1', () => process.stdout.write('Radar design spike: http://127.0.0.1:3130\n'));
