# Design — Homepage mobile hero

**Data:** 2026-07-04  
**Scope:** solo mobile (`< md`, fino a ~767 px). Desktop non viene toccato.  
**Goal:** creare una hero homepage mobile leggera, immediata e orientativa, senza cadere nel brochure SaaS generico. Deve spiegare in poche parole cos'è TooolVibes, cosa può fare l'utente, dove andare e perché esplorare, con un collegamento chiaro alla ruota/selettore sottostante.

---

## Approccio scelto

**Editoriale spaziale pulito (Approccio A).**

La hero mobile sostituisce il contenuto testuale denso del `Home3DHero` attuale con un blocco scuro, arioso e leggibile. Lo sfondo 3D animato viene lasciato per desktop; su mobile usiamo uno sfondo scuro con micro-dettagli spaziali statici. Il componente è dedicato e isolato, quindi il desktop non subisce regressioni.

---

## Struttura

Il componente `MobileMarketingHero` occupa l'intera altezza visibile del dispositivo (`min-h-[100dvh]`) e centra verticalmente i contenuti.

Ordine degli elementi dall'alto verso il basso:

1. **Label micro** — brand identity, centrata sopra la headline.
2. **Headline** — messaggio immediato.
3. **Sottotitolo** — una riga di contesto.
4. **Stack CTA** — due azioni leggere, in colonna su viewport piccole.
5. **Indicatore "Esplora"** — in fondo, invita a scrollare verso la ruota/selettore.

---

## Copy

| Elemento | Testo | Funzione |
|----------|-------|----------|
| Label | `TooolVibes` | Brand recognition |
| Headline | `Scegli tool AI validi` | Cos'è / value proposition |
| Sottotitolo | `Senza attraversare il rumore.` | Differenziazione |
| CTA primaria | `Esplora catalogo` → `/archivio` | Azione principale |
| CTA secondaria | `Radar live` → `/radar` | Azione secondaria |
| Indicatore | `Esplora` + chevron down | Orientamento verso la ruota |

Il messaggio risponde ai quattro punti richiesti:
- **Cos'è TooolVibes**: tool AI validi.
- **Cosa può fare l'utente**: esplorare il catalogo e il radar.
- **Dove può andare**: due CTA + indicatore verso la ruota.
- **Perché esplorare**: per evitare il rumore.

---

## Stile visivo

### Sfondo

- Colore base: `#06060E` (coerente con il mobile background coherence appena rifinito).
- Gradiente radiale morbido dal centro della hero verso i bordi: `#0B0B18` → `#06060E`.
- Micro-dettagli spaziali: puntini luce fissi (20-30 stelle) realizzati con CSS/SVG, opacità bassa (`0.3-0.6`), nessuna animazione continua.
- Nessun blur animato, nessun `backdrop-filter`, nessun glass, nessun 3D.

### Tipografia

- **Label**: `text-xs`, `uppercase`, `tracking-[0.2em]`, colore `slate-400`.
- **Headline**: `text-4xl` su 360 px, `text-5xl` su 430 px+, `font-bold`, `leading-[1.05]`, bianco.
- **Sottotitolo**: `text-lg`, `leading-relaxed`, colore `slate-300`.

### CTA

- **Primaria**: sfondo chiaro, testo scuro, `rounded-full`, padding generoso.
  - Su 360 px: larghezza quasi full (`w-full max-w-sm`).
  - Su viewport più grandi: `min-w-[220px]`.
- **Secondaria**: bordo sottile `slate-600`, testo `slate-200`, `rounded-full`, stesso padding.
- Stati hover/active: micro-scala `transform: scale(1.02)` e cambio opacità.

### Indicatore "Esplora"

- Pillola sottile con bordo `slate-700/50`, testo `slate-400`.
- Chevron down con animazione continua molto soft (`translateY` 4 px, 2 s, easing morbido).
- Al tap scrolla dolcemente fino al selettore a ruota (`#v-discovery-stage` o ref equivalente).

---

## Interazioni e animazioni

- **Entrata testi**: fade-in + slide-up con stagger di ~80 ms tra label, headline, sottotitolo e CTA.
- **Indicatore**: fade-in dopo le CTA, con loop discreto.
- **Tecniche**: solo `transform` e `opacity`; nessuna animazione di `width`, `height`, `blur`, `box-shadow`.
- **Reduced motion**: se `prefers-reduced-motion: reduce`, le animazioni vengono ridotte o disattivate.
- **Scroll indicator**: tap che invoca `scrollIntoView({ behavior: 'smooth' })` verso la sezione ruota.

---

## Transizione verso la ruota

La hero finisce con un fade morbido del gradiente che si fonde con lo sfondo `#06060E` della sezione sottostante (`MobileHeroSolar`/ruota), evitando stacchi netti o bande visive.

---

## Implementazione

### Componenti

1. **`components/home/mobile-marketing-hero.tsx`** — nuovo componente presentazionale.
   - Props: `weeklyTool` (opzionale) e link base.
   - Usa `framer-motion` per le animazioni (già presente nel progetto).
   - Usa Tailwind per layout e tipografia di base.
   - Usa classi custom da `styles/vibes-3d-maestoso.css` per dettagli spaziali e mobile-specifici.

2. **`components/3d-maestoso/home-3d-hero.tsx`** — wrapper condizionale.
   - Mantiene il contenuto desktop esistente intatto.
   - Su mobile (`< md`) renderizza `MobileMarketingHero`.
   - Per evitare SSR hydration mismatch si usa un hook `useIsMobile` che durante il primo render (server + client) assume il fallback desktop; dopo il mount aggiorna al valore reale. Questo mantiene il contenuto desktop intatto su desktop e mostra la hero mobile sui device piccoli, con un eventuale breve flash di transizione accettabile per questa sezione.

### File coinvolti

- `components/home/mobile-marketing-hero.tsx` *(nuovo)*
- `components/3d-maestoso/home-3d-hero.tsx` *(modifica wrapper)*
- `styles/vibes-3d-maestoso.css` *(stili mobile hero)*
- `app/(marketing)/page.tsx` *(probabilmente nessuna modifica)*

### Isolamento mobile

- Tutte le modifiche sono protette da breakpoint o classi mobile-only.
- Nessun impatto su desktop, backend, login, Supabase, routing, API.
- Il `VibesReactor`/canvas 3D rimane solo nella variante desktop.

---

## Acceptance criteria

- [ ] La hero mobile mostra label, headline, sottotitolo, due CTA e indicatore "Esplora".
- [ ] Il testo è leggibile, con contrasto sufficiente su sfondo scuro.
- [ ] Non ci sono sovrapposizioni con header o bottom nav.
- [ ] L'indicatore "Esplora" scrolla dolcemente verso la ruota/selettore.
- [ ] Le animazioni sono leggere e rispettano `prefers-reduced-motion`.
- [ ] Desktop non presenta regressioni.
- [ ] Build, lint e test passano.

---

## Riferimenti

- `app/(marketing)/page.tsx` — entry homepage.
- `components/3d-maestoso/home-3d-hero.tsx` — hero attuale (desktop + mobile).
- `components/home/mobile-hero-solar.tsx` — sezione ruota/selettore sottostante.
- `styles/vibes-3d-maestoso.css` — stili dark/mobile esistenti.
