/** Visual-only variants. Positions/radii come verbatim from the approved V2 DOM. */
const data = await (await fetch('./data.json')).json();
const concepts = {
  A: { name: 'Orbital Cartography', thesis: 'Un atlante del tempo: percorsi interrotti, territori aperti e segnali cartografici.' },
  B: { name: 'Precision Observatory', thesis: 'Una lente analitica: profondità incisa, dati ottici e calibrazione meccanica.' },
  C: { name: 'Signal Atlas', thesis: 'Un oggetto editoriale: territori, numeri e richiami che danno struttura al mercato.' },
};
const params = new URLSearchParams(location.search);
let concept = concepts[params.get('concept')] ? params.get('concept') : 'A';
let mode = ['GLOBAL', 'LOCAL', 'SELECTED'].includes(params.get('state')) ? params.get('state') : 'GLOBAL';
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const polar = (r, angle) => [50 + r * Math.sin(angle * Math.PI / 180), 50 - r * Math.cos(angle * Math.PI / 180)];
const arc = (r, start, end) => { const a = polar(r, start), b = polar(r, end); return `M ${a[0]} ${a[1]} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${b[0]} ${b[1]}`; };
const line = (x1, y1, x2, y2, stroke = '#665681', width = .7, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const path = (d, stroke, width = 1, extra = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const text = (x, y, value, cls = 'label', fill = '#cbc6e8', extra = '') => `<text x="${x}" y="${y}" class="${cls}" fill="${fill}" ${extra}>${esc(value)}</text>`;
const circle = (x, y, r, fill, stroke = 'none', width = 1, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const layer = (name, content) => `<g data-layer="${name}" aria-hidden="true">${content}</g>`;
const abbreviations = ['VIDEO', 'DESIGN', 'NO-CODE', 'GROWTH', 'FOCUS', 'CODING', 'AGENTI', 'ALTRO'];

function timeLabels(position = 'north') {
  return data.rings.map(({ ratio, label }) => {
    const r = 42 * ratio, x = position === 'west' ? 50 - r : 50, y = position === 'west' ? 51 : 50 - r - 1.2;
    return `<rect x="${x - 3.7}" y="${y - 3.1}" width="7.4" height="4.1" rx=".4" fill="#0b0620"/>${text(x, y, label.toUpperCase(), 'label mono', '#e4ddf3', 'text-anchor="middle"')}`;
  }).join('');
}

function marker(p, style, selected) {
  const r = p.radius, c = p.color;
  let body;
  if (style === 'A') {
    const hex = `M 0 ${-r} L ${r * .86} ${-r * .5} L ${r * .86} ${r * .5} L 0 ${r} L ${-r * .86} ${r * .5} L ${-r * .86} ${-r * .5} Z`;
    body = `<path d="${hex}" fill="${c}" fill-opacity=".1" stroke="${c}" stroke-width="${selected ? 1.8 : 1.2}"/>${line(-r * .55, 0, r * .55, 0, c, .8)}${line(0, -r * .55, 0, r * .55, c, .8)}${circle(0, 0, r * .24, c)}${path(`M ${-r * .4} ${-r * .78} L 0 ${-r} L ${r * .4} ${-r * .78}`, '#f5f3ff', .7, 'opacity=".65"')}`;
  } else if (style === 'B') {
    body = `${circle(0, 0, r, '#0b0620', c, 1.1)}${circle(0, 0, r * .73, c, 'none', 1, 'fill-opacity=".08"')}${path(arcLocal(r * .88, -70, 25), '#e9e4f6', 1, 'opacity=".45"')}${line(-r * .42, 0, r * .42, 0, c, .7)}${line(0, -r * .42, 0, r * .42, c, .7)}${circle(0, 0, r * .26, c)}${[0, 90, 180, 270].map(a => { const rad = a * Math.PI / 180; return line(r * .8 * Math.sin(rad), -r * .8 * Math.cos(rad), r * Math.sin(rad), -r * Math.cos(rad), c, 1.3); }).join('')}`;
  } else {
    body = `<path d="M ${-r} ${-r * .54} H ${r * .55} L ${r} ${-r * .1} V ${r * .54} H ${-r} Z" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-width="1"/>${line(-r, r * .54, r, r * .54, c, 2.1)}<rect x="${-r * .78}" y="${-r * .26}" width="${r * .52}" height="${r * .52}" fill="${c}"/>${line(r * .03, -r * .06, r * .58, -r * .06, '#d6cfe8', .8, 'opacity=".65"')}`;
  }
  if (p.catalogStatus === 'linked') body += `<path d="M -.6 0 L 0 -.6 L .6 0 L 0 .6 Z" fill="#e4ddf3" stroke="#0b0620" stroke-width=".6"/>`;
  return `<g class="datum" data-id="${p.id}" data-x="${p.x}" data-y="${p.y}" data-radius="${r}" data-cluster="${p.cluster}" data-status="${p.catalogStatus}" data-selected="${selected}" style="transform:translate(${p.x}px, ${p.y}px)" aria-hidden="true">${body}</g>`;
}

function arcLocal(r, start, end) {
  const a = start * Math.PI / 180, b = end * Math.PI / 180;
  return `M ${r * Math.sin(a)} ${-r * Math.cos(a)} A ${r} ${r} 0 0 1 ${r * Math.sin(b)} ${-r * Math.cos(b)}`;
}

function orbital(view, accent) {
  const local = mode !== 'GLOBAL';
  const rings = data.rings.map(({ ratio }, i) => {
    const r = 42 * ratio;
    const tracks = local ? [[-40, 75], [105, 198], [233, 290]] : [[-20 + i * 9, 61 + i * 8], [115 - i * 4, 218 - i * 6], [248 + i * 4, 308 + i * 8]];
    return tracks.map(([a, b], j) => path(arc(r, a, b), j === 0 ? accent : '#79708f', i === 3 ? 1.2 : .7, `opacity="${j === 0 ? .62 : .27}"`) + (i % 2 === 0 ? path(arc(r - 1.15, a + 4, b - 8), accent, 7, 'opacity=".035"') : '')).join('');
  }).join('');
  const landmarks = data.clusterOrder.map((id, i) => {
    if (local && id !== view.focusedCluster) return '';
    const color = data.palette[id], start = i * 45;
    const a = polar(43.8, start + 9), b = polar(46, start + 9);
    return path(arc(45, start + 12, start + 37), color, 2.4, 'opacity=".6"') + line(...a, ...b, color, 1.3) + text(...polar(48, start + 24), abbreviations[i], 'micro mono desktop-only', color, 'text-anchor="middle"');
  }).join('');
  const terrain = local ? path(arc(25.8, 112, 247), accent, 24, 'opacity=".035"') : path(arc(26.5, 160, 266), '#6a3cff', 38, 'opacity=".07"');
  const frame = `${path('M 5 26 V 8 H 25 M 75 92 H 95 V 74', '#47345f', .8)}${text(7, 94, local ? `CODING / ${view.points.length.toString().padStart(2, '0')}` : `MERCATO / ${data.signalCount}`, 'micro mono')}${text(94, 9, '24H', 'display', '#f5f3ff', 'font-size="5" text-anchor="end"')}${line(6, 71, 17, 71, '#6a3cff', 2)}${text(7, 76, 'ATLANTE', 'micro mono desktop-only', '#a49dc8')}`;
  return layer('cartographic-territory', terrain) + layer('broken-time-tracks', rings) + layer('landmarks', landmarks) + layer('time-labels', timeLabels()) + layer('cartographic-frame', frame) + layer('origin', `${line(47.6, 50, 52.4, 50, accent, .8)}${line(50, 47.6, 50, 52.4, accent, .8)}${circle(50, 50, .35, '#f5f3ff')}`);
}

function observatory(view, accent) {
  const local = mode !== 'GLOBAL';
  const plate = `${circle(50, 50, 46, 'url(#optical-well)', '#37264f', 2)}${circle(50, 50, 44.5, 'none', '#110a24', 7)}${path(arc(45, -58, 63), '#b9adce', 1.1, 'opacity=".6"')}${path(arc(45, 108, 240), '#2a1e41', 1.7)}${circle(50, 50, 42.6, 'none', '#857597', .75, 'opacity=".4"')}${path(arc(41.6, -74, 35), accent, 6, 'opacity=".035"')}`;
  const ticks = Array.from({ length: 80 }, (_, i) => {
    const a = i * 4.5, major = i % 10 === 0, p = polar(major ? 43 : 43.9, a), q = polar(44.6, a);
    return line(...p, ...q, major ? '#cbc6e8' : '#6c5d80', major ? 1.1 : .65, `opacity="${major ? .8 : .4}" class="${i % 2 ? 'desktop-only' : ''}"`);
  }).join('');
  const reticle = `${line(9, 50, 45, 50, '#887997', .75, 'opacity=".36"')}${line(55, 50, 91, 50, '#887997', .75, 'opacity=".36"')}${line(50, 9, 50, 45, '#887997', .75, 'opacity=".36"')}${line(50, 55, 50, 91, '#887997', .75, 'opacity=".36"')}${data.rings.map(({ ratio }, i) => path(arc(42 * ratio, 35, 145), '#897995', .8, 'opacity=".24"') + path(arc(42 * ratio, 215, 325), '#897995', .8, 'opacity=".24"') + line(50 - 1.1, 50 - 42 * ratio, 50 + 1.1, 50 - 42 * ratio, accent, 1.2) + (i === 0 ? circle(50, 50, 42 * ratio, 'none', accent, .8, 'opacity=".12"') : '')).join('')}`;
  const calibration = local ? path(arc(47, 18, 132), accent, 3, 'opacity=".6"') : data.clusterOrder.map((id, i) => path(arc(47, i * 45 + 3, i * 45 + 16), data.palette[id], 3, 'opacity=".7"')).join('');
  const corners = path('M 8 19 V 8 H 19 M 81 8 H 92 V 19 M 8 81 V 92 H 19 M 81 92 H 92 V 81', '#51405f', .8);
  return layer('optical-plate', plate) + layer('mechanical-ticks', ticks) + layer('reticle', reticle) + layer('calibration', calibration) + layer('time-labels', timeLabels()) + layer('optical-origin', `${circle(50, 50, 1.65, '#0b0620', '#90819f', .8)}${circle(50, 50, .32, '#f5f3ff')}`) + layer('plate-inscription', `${corners}${text(9, 97, local ? 'LENTE / CODING' : 'OSSERVATORIO', 'micro mono')}${text(91, 97, '24H', 'micro mono', '#cbc6e8', 'text-anchor="end"')}`);
}

function atlas(view, accent) {
  const local = mode !== 'GLOBAL';
  const sectors = data.clusterOrder.map((id, i) => {
    if (local && id !== view.focusedCluster) return '';
    const start = local ? 92 : i * 45 + 3, end = local ? 256 : i * 45 + 41;
    const a = polar(39.5, start), b = polar(39.5, end), c = polar(22, end), e = polar(22, start);
    const wedge = `M ${a[0]} ${a[1]} A 39.5 39.5 0 0 1 ${b[0]} ${b[1]} L ${c[0]} ${c[1]} A 22 22 0 0 0 ${e[0]} ${e[1]} Z`;
    const count = data.clusters.find(c => c.id === id)?.count ?? 0;
    return `<path d="${wedge}" fill="${data.palette[id]}" fill-opacity="${local ? .075 : .065}"/>` + (count ? path(arc(42.6, start, end), data.palette[id], count >= 7 ? 3 : 1, 'opacity=".55"') : '') + (!local && count ? text(...polar(46.5, i * 45 + 24), `${abbreviations[i]} ${count}`, 'micro mono desktop-only', data.palette[id], 'text-anchor="middle"') : '');
  }).join('');
  const time = data.rings.map(({ ratio }, i) => path(arc(42 * ratio, 252, 302), '#9b8aaf', i === 3 ? 1.2 : .8, 'opacity=".5"')).join('');
  const type = `${text(5, 12, local ? view.points.length.toString().padStart(2, '0') : data.signalCount, 'display', '#f5f3ff', 'font-size="9"')}${text(6, 17, 'SEGNALI', 'micro mono', '#a49dc8')}${text(94, 12, '24H', 'display', '#b8a6ea', 'font-size="7" text-anchor="end"')}${line(5, 20, 20, 20, accent, 2)}${text(5, 97, local ? 'SVILUPPO / CODING' : 'IL MERCATO, ORA', 'micro mono', '#e4ddf3')}${line(5, 91, 95, 91, '#48355d', .8)}`;
  const density = local ? `${text(93, 81, view.points.length, 'display desktop-only', accent, 'font-size="6" text-anchor="end"')}${text(93, 85, 'NEL CLUSTER', 'micro mono desktop-only', '#a49dc8', 'text-anchor="end"')}` : `${text(93, 81, data.clusters.length, 'display desktop-only', '#a78bfa', 'font-size="6" text-anchor="end"')}${text(93, 85, 'AREE ATTIVE', 'micro mono desktop-only', '#a49dc8', 'text-anchor="end"')}`;
  // One static grouping bracket; no invented network/history relationships.
  const grouping = local ? path('M 76 34 H 80 V 72 H 76', accent, 1, 'opacity=".45"') : path('M 29 72 V 76 H 63 V 72', '#9c86c0', 1, 'opacity=".45"');
  return layer('editorial-territories', sectors) + layer('temporal-fragments', time) + layer('time-labels', timeLabels('west')) + layer('editorial-type', type + density) + layer('grouping-bracket', grouping) + layer('origin', `${text(50, 48.5, 'ORA', 'micro mono', '#a49dc8', 'text-anchor="middle"')}${circle(50, 50, .4, '#f5f3ff')}`);
}

function selection(view, style, accent) {
  const p = view.points.find(p => p.id === view.selectedId);
  if (!p) return '';
  const bearing = Math.atan2(p.x - 50, 50 - p.y) * 180 / Math.PI;
  const a = polar(43.8, bearing), r = p.radius;
  const name = p.name.length > 17 ? p.name.slice(0, 16) + '…' : p.name;
  let cue;
  if (style === 'A') {
    const start = polar(2, bearing);
    cue = `${line(...start, p.x, p.y, accent, 1, 'stroke-dasharray="3 2" opacity=".65"')}${path(arc(43.8, bearing - 5, bearing + 5), accent, 3)}${path(`M ${p.x + r + 1.4} ${p.y - 1} H 79 V 23 H 92`, accent, 1)}${text(92, 20, name, 'label', '#f5f3ff', 'text-anchor="end"')}${text(92, 26.5, `${p.ageHours.toFixed(1).replace('.', ',')}H / ${p.attention} ATT.`, 'micro mono desktop-only', '#a49dc8', 'text-anchor="end"')}`;
  } else if (style === 'B') {
    const d = r + 1.6, x = p.x, y = p.y;
    cue = `${path(`M ${x - d} ${y - d + 2} V ${y - d} H ${x - d + 2} M ${x + d - 2} ${y - d} H ${x + d} V ${y - d + 2} M ${x - d} ${y + d - 2} V ${y + d} H ${x - d + 2} M ${x + d - 2} ${y + d} H ${x + d} V ${y + d - 2}`, '#d7cbee', 1.3)}${line(50, 50, p.x, p.y, accent, .8, 'opacity=".45"')}${line(p.x, p.y - d - 1, ...a, accent, 1)}${path(arc(47.8, bearing - 3, bearing + 3), accent, 4)}${text(50, 79.5, name, 'label', '#f5f3ff', 'text-anchor="middle"')}${text(50, 84, `${p.ageHours.toFixed(1).replace('.', ',')}H / ${p.attention} ATT.`, 'micro mono desktop-only', '#a49dc8', 'text-anchor="middle"')}`;
  } else {
    const y = 23, x = 76;
    cue = `<rect x="${p.x - r - .8}" y="${p.y - r * .54 - .8}" width="${2 * r + 1.6}" height="${r * 1.08 + 1.6}" fill="${accent}" fill-opacity=".055" stroke="#c4ace9" stroke-width="1"/>${path(`M ${p.x + r + .8} ${p.y} L ${x - 4} ${y + 5} H 94`, accent, 1.2)}${text(94, y, name, 'label', '#f5f3ff', 'text-anchor="end"')}${text(94, y + 10, `${p.attention}`, 'display desktop-only', accent, 'font-size="6" text-anchor="end"')}${text(94, y + 14, 'ATTENZIONE', 'micro mono desktop-only', '#a49dc8', 'text-anchor="end"')}`;
  }
  return layer('inspection', cue);
}

function render() {
  const width = innerWidth <= 600 ? 390 : 1440;
  const view = data.views[`${width}-${mode}`], accent = view.focusedCluster ? data.palette[view.focusedCluster] : '#22d3ee';
  const defs = `<defs><radialGradient id="optical-well" cx="42%" cy="34%"><stop offset="0" stop-color="#1c1433"/><stop offset=".68" stop-color="#0c071c"/><stop offset="1" stop-color="#060310"/></radialGradient></defs>`;
  const field = concept === 'A' ? orbital(view, accent) : concept === 'B' ? observatory(view, accent) : atlas(view, accent);
  const body = `<svg viewBox="0 0 100 100" role="img" aria-labelledby="instrument-title" data-concept="${concept}" data-mode="${mode}" data-fixture-width="${width}"><title id="instrument-title">${concepts[concept].name} — ${mode === 'GLOBAL' ? 'Panoramica globale' : 'Sviluppo & Coding'} — snapshot 24 ore</title>${defs}${field}${layer('signal-field', view.points.map(p => marker(p, concept, p.id === view.selectedId)).join(''))}${selection(view, concept, accent)}</svg>`;
  document.querySelector('.instrument').innerHTML = body;
  // Match React/V2's DOM style assignment; WebKit rounds parsed style attributes.
  document.querySelectorAll('.datum').forEach((el, i) => {
    const p = view.points[i]; el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  });
  document.querySelector('#concept-title').textContent = `${concept} / ${concepts[concept].name}`;
  document.querySelector('#concept-thesis').textContent = concepts[concept].thesis;
  document.querySelector('#mode-label').textContent = mode === 'GLOBAL' ? 'GLOBALE' : mode === 'LOCAL' ? 'LOCALE / SVILUPPO & CODING' : `ISPEZIONE / ${view.points[0].name}`;
  document.querySelector('#signal-summary').textContent = view.points.map(p => p.label).join(' ');
  document.querySelector('#concept-controls').innerHTML = Object.keys(concepts).map(c => `<button type="button" data-concept="${c}" aria-pressed="${c === concept}">${c}</button>`).join('');
  document.querySelector('#state-controls').innerHTML = ['GLOBAL', 'LOCAL', 'SELECTED'].map(s => `<button type="button" data-state="${s}" aria-pressed="${s === mode}">${{GLOBAL:'Globale', LOCAL:'Locale', SELECTED:'Selected'}[s]}</button>`).join('');
  document.querySelectorAll('button[data-concept]').forEach(b => b.addEventListener('click', () => { concept = b.dataset.concept; render(); }));
  document.querySelectorAll('button[data-state]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.state; render(); }));
  document.body.dataset.ready = 'true';
}
window.addEventListener('resize', render);
render();
