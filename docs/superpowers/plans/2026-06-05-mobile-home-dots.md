# Pallini Mobile Home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rifunzionalizzare i pallini orbitali della Home mobile con gerarchia visiva, anelli espansi, text avoidance e microinterazioni.

**Architecture:** Manteniamo il sistema CSS-orbitale esistente in `vibe-home-v2.tsx`, ma lo ristrutturiamo per distribuire i nodi su 2 anelli espansi (invece di 3 ammassati). Aggiungiamo un hook `useTextAvoidance` leggero che sposta i nodi quando sovrappongono testi. Tutte le microinterazioni sono CSS-only per performance.

**Tech Stack:** React, Next.js, TypeScript, CSS custom properties, RAF-throttled scroll listener.

---

## File Structure

| File | Responsibility |
|------|--------------|
| `lib/hooks/use-text-avoidance.ts` | Nuovo hook: calcola sovrapposizione nodi/text-zones e applica classe CSS di avoidance |
| `components/home/vibe-home-v2.tsx` | Modifica: 2 anelli espansi su mobile, assegnazione gerarchica nodi, integrazione hook, markup `data-text-zone` |
| `app/globals.css` | Modifica: stili mobile per anelli espansi, gerarchia, keyframes microinterazioni, avoidance, touch target espansi |

---

## Task 1: Hook `useTextAvoidance`

**Files:**
- Create: `lib/hooks/use-text-avoidance.ts`
- Test: `npm run build` (TypeScript check)

### Step 1.1: Scrivi l'hook

```typescript
"use client";

import { useEffect } from "react";

function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

function getOverlapPercent(rect1: DOMRect, rect2: DOMRect): number {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left)
  );
  const yOverlap = Math.max(
    0,
    Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)
  );
  const overlapArea = xOverlap * yOverlap;
  const nodeArea = rect1.width * rect1.height;
  return nodeArea > 0 ? overlapArea / nodeArea : 0;
}

/**
 * Hook che monitora la sovrapposizione tra nodi orbitali e zone di testo.
 * Quando un nodo sovrappone una text-zone per >30%, aggiunge la classe
 * `home-orbit-node--avoiding` e setta `--avoid-shift` per lo spostamento laterale.
 */
export function useTextAvoidance(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const check = () => {
      const nodes = container.querySelectorAll<HTMLElement>(".catalog-orbit-node");
      const textZones = document.querySelectorAll<HTMLElement>('[data-text-zone="true"]');

      if (nodes.length === 0 || textZones.length === 0) return;

      const textRects = Array.from(textZones).map((el) => el.getBoundingClientRect());

      nodes.forEach((node) => {
        // Skip atmospheric nodes — already transparent enough
        if (node.classList.contains("home-orbit-node--atmospheric")) return;

        const nodeRect = node.getBoundingClientRect();
        let maxOverlap = 0;
        let shiftDirection = 0; // -1 = left, 1 = right

        for (const textRect of textRects) {
          const overlap = getOverlapPercent(nodeRect, textRect);
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            const viewportCenter = window.innerWidth / 2;
            const nodeCenter = nodeRect.left + nodeRect.width / 2;
            shiftDirection = nodeCenter < viewportCenter ? -1 : 1;
          }
        }

        if (maxOverlap > 0.3) {
          node.classList.add("home-orbit-node--avoiding");
          node.style.setProperty("--avoid-shift", `${shiftDirection * 40}px`);
        } else if (maxOverlap < 0.1) {
          node.classList.remove("home-orbit-node--avoiding");
          node.style.removeProperty("--avoid-shift");
        }
      });
    };

    const throttledCheck = throttle(check, 16);
    window.addEventListener("scroll", throttledCheck, { passive: true });
    window.addEventListener("resize", throttledCheck, { passive: true });

    // Initial check after layout settles
    const rafId = requestAnimationFrame(() => requestAnimationFrame(check));

    return () => {
      window.removeEventListener("scroll", throttledCheck);
      window.removeEventListener("resize", throttledCheck);
      cancelAnimationFrame(rafId);
    };
  }, [containerRef]);
}
```

### Step 1.2: Verifica TypeScript

Run: `npx tsc --noEmit lib/hooks/use-text-avoidance.ts`
Expected: nessun errore

### Step 1.3: Commit

```bash
git add lib/hooks/use-text-avoidance.ts
git commit -m "feat: add useTextAvoidance hook for mobile orbit nodes"
```

---

## Task 2: Modifica `HomeOrbitStage`

**Files:**
- Modify: `components/home/vibe-home-v2.tsx`
- Test: `npm run build`

### Step 2.1: Importa l'hook

Aggiungi in cima al file, dopo gli import esistenti:

```typescript
import { useTextAvoidance } from "@/lib/hooks/use-text-avoidance";
```

### Step 2.2: Aggiungi `ref` al container orbital

All'interno di `HomeOrbitStage`, aggiungi:

```typescript
const orbitSystemRef = useRef<HTMLDivElement>(null);
useTextAvoidance(orbitSystemRef);
```

E attacca il ref al container:

```tsx
<div
  ref={orbitSystemRef}
  className="home-orbit-system catalog-orbit-system"
  aria-label={`${label}: nodi interattivi`}
>
```

### Step 2.3: Modifica `ringRadii` e logica di distribuzione

Sostituisci le righe:

```tsx
const maxVisible = isCompact ? 5 : 9;
const visibleItems = items.slice(0, maxVisible);
const ringRadii = isCompact ? [82, 124, 166] : [150, 234, 318];
```

Con:

```tsx
const maxVisible = isCompact ? 5 : 9;
const visibleItems = items.slice(0, maxVisible);
const ringRadii = isCompact ? [120, 186] : [150, 234, 318];
const ringCounts = isCompact ? [2, 3] : [3, 3, 3];

// Pre-calculate ring assignment for each visible item
let assigned = 0;
const ringForIndex: number[] = [];
const stepForIndex: number[] = [];
ringCounts.forEach((count, rIdx) => {
  for (let sIdx = 0; sIdx < count && assigned < visibleItems.length; sIdx++, assigned++) {
    ringForIndex.push(rIdx);
    stepForIndex.push(sIdx);
  }
});
```

### Step 2.4: Aggiungi `data-text-zone` agli elementi testuali

Nel JSX di `HomeOrbitStage`, aggiungi `data-text-zone="true"` a:

1. Il contenitore HUD:
```tsx
<div className="home-orbit-hud catalog-orbit-hud" data-orbit-shield data-text-zone="true">
```

2. (Opzionale ma raccomandato) se ci sono altri blocchi di testo nella sezione, ma il HUD è il principale.

### Step 2.5: Modifica il render dei nodi per usare la nuova logica

Nel `visibleItems.map`, sostituisci il calcolo di `ringIndex`, `sameRingCount`, `stepIndex`:

Da:
```tsx
const ringIndex = index % ringRadii.length;
const sameRingCount = Math.ceil(visibleItems.length / ringRadii.length);
const stepIndex = Math.floor(index / ringRadii.length);
```

A:
```tsx
const ringIndex = ringForIndex[index] ?? 0;
const stepIndex = stepForIndex[index] ?? 0;
const sameRingCount = ringCounts[ringIndex] ?? 1;
```

### Step 2.6: Aggiungi classi gerarchiche

Prima del return del `map`, calcola la priorità:

```tsx
const nodePriority =
  index < 2 ? "principal" : index === 2 ? "secondary" : "atmospheric";
```

E aggiorna il `className` del `Link`:

```tsx
className={`catalog-orbit-node home-orbit-node home-orbit-node--${nodePriority} home-orbit-node--${item.variant ?? "tool"}${index >= 5 ? " home-orbit-node--compact-extra" : ""}`}
```

**Nota:** rimuovi la classe `home-orbit-node--compact-extra` se non serve più, o lasciala per retrocompatibilità. Dato che su mobile mostriamo esattamente 5 nodi, `index >= 5` non sarà mai vero. Puoi lasciarla, non fa danno.

### Step 2.7: Aggiorna stili inline per dimensione mobile

Sostituisci la riga:
```tsx
"--node-size": isPrimary ? (isCompact ? "4.75rem" : "6rem") : (isCompact ? "4.05rem" : "5rem"),
```

Con:
```tsx
"--node-size": isCompact
  ? (nodePriority === "principal" ? "3.5rem" : nodePriority === "secondary" ? "2.25rem" : "2rem")
  : (isPrimary ? "6rem" : "5rem"),
```

**Nota:** le dimensioni desktop restano invariate.

### Step 2.8: Verifica build

Run: `npm run build`
Expected: 0 errori, 0 warning critici

### Step 2.9: Commit

```bash
git add components/home/vibe-home-v2.tsx
git commit -m "feat: restructure mobile orbit nodes with 2 expanded rings and hierarchy"
```

---

## Task 3: Aggiorna `globals.css`

**Files:**
- Modify: `app/globals.css` (sezioni mobili esistenti e nuove)
- Test: `npm run build`

### Step 3.1: Aggiungi keyframes per microinterazioni

Aggiungi in fondo al file, prima del blocco `prefers-reduced-motion`:

```css
/* ── Mobile orbit micro-interactions ── */
@keyframes orbit-float {
  0%, 100% {
    transform:
      translate(-50%, -50%)
      rotateZ(var(--orbit-angle, 0deg))
      translateX(var(--orbit-radius, 12rem))
      rotateZ(var(--orbit-angle-back, 0deg))
      translateZ(var(--orbit-depth, 0px))
      translateY(0px);
  }
  50% {
    transform:
      translate(-50%, -50%)
      rotateZ(var(--orbit-angle, 0deg))
      translateX(var(--orbit-radius, 12rem))
      rotateZ(var(--orbit-angle-back, 0deg))
      translateZ(var(--orbit-depth, 0px))
      translateY(-6px);
  }
}

@keyframes orbit-pulse-glow {
  0%, 100% {
    box-shadow: 0 0 12px color-mix(in srgb, var(--node-color, #6a3cff) 40%, transparent);
  }
  50% {
    box-shadow: 0 0 28px color-mix(in srgb, var(--node-color, #6a3cff) 60%, transparent);
  }
}
```

### Step 3.2: Sovrascrivi stili mobile per anelli espansi e gerarchia

All'interno del blocco `@media (max-width: 767px)`, trova le righe esistenti per i nodi e aggiungi/sostituisci:

```css
@media (max-width: 767px) {
  /* ... existing mobile styles ... */

  /* ── Expanded rings on mobile ── */
  .catalog-orbit-ring {
    --ring-opacity: 0.32;
  }

  /* ── Node hierarchy: principal / secondary / atmospheric ── */
  .home-orbit-node--principal {
    --node-size: 3.5rem !important;
    animation-name: tv-catalog-saturn-orbit, orbit-float;
    animation-duration: var(--orbit-duration, 36s), 3.5s;
    animation-timing-function: linear, ease-in-out;
    animation-iteration-count: infinite, infinite;
    animation-delay: var(--orbit-delay, 0s), calc(var(--orbit-delay, 0s) + var(--orbit-index, 0) * 0.7s);
    will-change: transform;
  }

  .home-orbit-node--principal .catalog-orbit-node__body {
    animation: orbit-pulse-glow 2.2s ease-in-out infinite;
    border-width: 2px;
  }

  .home-orbit-node--principal .catalog-orbit-node__halo {
    opacity: 0.72;
  }

  .home-orbit-node--secondary {
    --node-size: 2.25rem !important;
    animation-name: tv-catalog-saturn-orbit, orbit-float;
    animation-duration: var(--orbit-duration, 36s), 3.5s;
    animation-timing-function: linear, ease-in-out;
    animation-iteration-count: infinite, infinite;
    animation-delay: var(--orbit-delay, 0s), calc(var(--orbit-delay, 0s) + 1.4s);
  }

  .home-orbit-node--secondary .catalog-orbit-node__halo {
    opacity: 0.5;
  }

  .home-orbit-node--secondary::after {
    content: "";
    position: absolute;
    inset: -8px;
    border-radius: inherit;
    z-index: 10;
  }

  .home-orbit-node--atmospheric {
    --node-size: 2rem !important;
    pointer-events: none;
    opacity: 0.4;
    animation-name: tv-catalog-saturn-orbit, orbit-float;
    animation-duration: var(--orbit-duration, 36s), 3.5s;
    animation-timing-function: linear, ease-in-out;
    animation-iteration-count: infinite, infinite;
    animation-delay: var(--orbit-delay, 0s), calc(var(--orbit-delay, 0s) + 2.1s);
  }

  .home-orbit-node--atmospheric .catalog-orbit-node__body {
    border-width: 1px;
    opacity: 0.6;
  }

  .home-orbit-node--atmospheric .catalog-orbit-node__halo {
    opacity: 0.25;
  }

  .home-orbit-node--atmospheric .catalog-orbit-node__label {
    display: none;
  }

  /* ── Tap feedback ── */
  @media (hover: none) and (pointer: coarse) {
    .home-orbit-node--principal:active .catalog-orbit-node__body,
    .home-orbit-node--secondary:active .catalog-orbit-node__body {
      transform: scale(0.92);
      box-shadow:
        0 22px 56px color-mix(in srgb, var(--node-color, #6a3cff) 30%, transparent),
        inset 0 1px 0 rgba(255, 255, 255, 0.32);
      transition: transform 150ms ease, box-shadow 150ms ease;
    }
  }

  /* ── Text avoidance ── */
  .home-orbit-node--avoiding {
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform:
      translate(-50%, -50%)
      rotateZ(var(--orbit-angle, 0deg))
      translateX(var(--orbit-radius, 12rem))
      rotateZ(var(--orbit-angle-back, 0deg))
      translateZ(var(--orbit-depth, 0px))
      translateX(var(--avoid-shift, 0px))
      scale(0.6) !important;
    opacity: 0.35 !important;
    z-index: 1;
  }

  /* Override orbit animation while avoiding to prevent jitter */
  .home-orbit-node--avoiding {
    animation-play-state: paused, paused;
  }
}
```

**Nota importante:** `orbit-float` deve incorporare la stessa base transform di `tv-catalog-saturn-orbit` + `translateY`. Il keyframe sopra assume che il nodo parta dalla posizione orbitale e aggiunga `translateY`. Tuttavia, dato che `tv-catalog-saturn-orbit` sovrascrive `transform` completamente, per combinare le due animazioni dobbiamo fare attenzione.

In realtà, la combinazione di `animation-name: tv-catalog-saturn-orbit, orbit-float` non funziona come vogliamo perché entrambe sovrascrivono `transform`. La soluzione corretta è usare un wrapper per il floating:

```css
/* Invece di animare il nodo stesso, animiamo un wrapper interno */
@keyframes orbit-float-y {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
```

Ma questo richiede un elemento wrapper aggiuntivo nel DOM. Per semplicità, usiamo `translateY` come offset dall'animazione orbitale esistente, ma dato che entrambe animano `transform`, la seconda sovrascrive la prima.

**Soluzione pratica:** aggiungiamo un `span` wrapper dentro il nodo che gestisce il floating. Ma questo modifica il DOM.

Alternativa: usiamo `margin-top` o `top` per il floating, ma questi triggerano layout.

Alternativa migliore: usiamo `::before` per il floating. Ma anche `::before` anima `transform` sullo stesso elemento.

In realtà, quando applichi più animazioni CSS allo stesso elemento con `animation-name: a, b`, le proprietà animate si combinano. Se entrambe animano `transform`, l'ultima nel `animation-name` sovrascrive la prima. Quindi `orbit-float` sovrascriverebbe `tv-catalog-saturn-orbit`, perdendo l'orbita.

**Soluzione corretta:** modifichiamo il keyframe `orbit-float` per includere la base dell'orbita, oppure modifichiamo il markup per avere un wrapper.

Data la complessità, per il floating possiamo usare un approccio diverso: **modifichiamo `tv-catalog-saturn-orbit` mobile** per includere il floating direttamente nell'orbita. Ma questo cambia l'orbita per tutti i nodi.

Oppure: creiamo un **nuovo keyframe dedicato mobile** che combina orbita + floating:

```css
@keyframes tv-catalog-saturn-orbit-mobile {
  0% {
    transform:
      translate(-50%, -50%)
      rotateZ(var(--orbit-angle, 0deg))
      translateX(var(--orbit-radius, 12rem))
      rotateZ(var(--orbit-angle-back, 0deg))
      translateZ(var(--orbit-depth, 0px))
      translateY(0px);
  }
  50% {
    transform:
      translate(-50%, -50%)
      rotateZ(calc(var(--orbit-angle, 0deg) + 180deg))
      translateX(var(--orbit-radius, 12rem))
      rotateZ(calc(var(--orbit-angle-back, 0deg) - 180deg))
      translateZ(var(--orbit-depth, 0px))
      translateY(-6px);
  }
  100% {
    transform:
      translate(-50%, -50%)
      rotateZ(calc(var(--orbit-angle, 0deg) + 360deg))
      translateX(var(--orbit-radius, 12rem))
      rotateZ(calc(var(--orbit-angle-back, 0deg) - 360deg))
      translateZ(var(--orbit-depth, 0px))
      translateY(0px);
  }
}
```

E poi su mobile usiamo `animation-name: tv-catalog-saturn-orbit-mobile` invece di `tv-catalog-saturn-orbit`.

Ma questo duplica la logica orbitale. Per semplicità, possiamo rinunciare al floating verticale separato e usare solo la pulsazione glow come microinterazione principale. Il floating può essere aggiunto in un secondo momento.

Per mantenere il piano snello, rimuoviamo il keyframe `orbit-float` e usiamo solo `orbit-pulse-glow` per i principali. Il feeling fluttuante è già dato dall'orbita stessa.

Quindi le regole CSS mobile diventano:

```css
@media (max-width: 767px) {
  /* ... existing mobile styles ... */

  .home-orbit-node--principal {
    --node-size: 3.5rem !important;
    will-change: transform;
  }

  .home-orbit-node--principal .catalog-orbit-node__body {
    animation: orbit-pulse-glow 2.2s ease-in-out infinite;
    border-width: 2px;
  }

  .home-orbit-node--principal .catalog-orbit-node__halo {
    opacity: 0.72;
  }

  .home-orbit-node--secondary {
    --node-size: 2.25rem !important;
  }

  .home-orbit-node--secondary .catalog-orbit-node__halo {
    opacity: 0.5;
  }

  .home-orbit-node--secondary::after {
    content: "";
    position: absolute;
    inset: -8px;
    border-radius: inherit;
    z-index: 10;
  }

  .home-orbit-node--atmospheric {
    --node-size: 2rem !important;
    pointer-events: none;
    opacity: 0.4;
  }

  .home-orbit-node--atmospheric .catalog-orbit-node__body {
    border-width: 1px;
    opacity: 0.6;
  }

  .home-orbit-node--atmospheric .catalog-orbit-node__halo {
    opacity: 0.25;
  }

  .home-orbit-node--atmospheric .catalog-orbit-node__label {
    display: none;
  }

  /* Tap feedback */
  @media (hover: none) and (pointer: coarse) {
    .home-orbit-node--principal:active .catalog-orbit-node__body,
    .home-orbit-node--secondary:active .catalog-orbit-node__body {
      transform: scale(0.92);
      box-shadow:
        0 22px 56px color-mix(in srgb, var(--node-color, #6a3cff) 30%, transparent),
        inset 0 1px 0 rgba(255, 255, 255, 0.32);
      transition: transform 150ms ease, box-shadow 150ms ease;
    }
  }

  /* Text avoidance */
  .home-orbit-node--avoiding {
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform:
      translate(-50%, -50%)
      rotateZ(var(--orbit-angle, 0deg))
      translateX(var(--orbit-radius, 12rem))
      rotateZ(var(--orbit-angle-back, 0deg))
      translateZ(var(--orbit-depth, 0px))
      translateX(var(--avoid-shift, 0px))
      scale(0.6) !important;
    opacity: 0.35 !important;
    z-index: 1;
    animation-play-state: paused;
  }
}
```

Nota: `animation-play-state: paused` su `.home-orbit-node--avoiding` mette in pausa l'orbita mentre si sposta, evitando jitter.

### Step 3.3: Verifica build

Run: `npm run build`
Expected: 0 errori

### Step 3.4: Commit

```bash
git add app/globals.css
git commit -m "feat: mobile orbit node hierarchy, glow, tap feedback and text avoidance styles"
```

---

## Task 4: Verifica Finale

### Step 4.1: Build completa

Run: `npm run build`
Expected: 0 errori, build success

### Step 4.2: Checklista visiva manuale (browser mobile o devtools)

Apri la Home in modalità mobile (375px width) e verifica:
- [ ] 5 pallini visibili, non 3
- [ ] 2 pallini principali più grandi (56px area visibile circa)
- [ ] 1 pallino secondario medio (36px)
- [ ] 2 pallini piccoli e trasparenti (32px)
- [ ] I 2 piccoli non sono cliccabili (`pointer-events: none`)
- [ ] I 3 cliccabili hanno area touch adeguata
- [ ] Scrolling: quando un pallino passa sopra il testo HUD, si sposta lateralmente e si riduce
- [ ] Desktop (`>=768px`): nodi invariati, 9 nodi, 3 anelli come prima
- [ ] Nessun errore console

### Step 4.3: Commit finale

```bash
git add .
git commit -m "feat: mobile home dots — expanded orbits, hierarchy, text avoidance, tap feedback"
```

---

## Self-Review Checklist

### Spec coverage

| Requisito spec | Task che lo implementa |
|----------------|------------------------|
| 2 anelli espansi mobile | Task 2, Step 2.3 |
| Gerarchia 2 principal + 1 secondary + 2 atmospheric | Task 2, Step 2.6; Task 3, Step 3.2 |
| Glow pulsante su principali | Task 3, Step 3.1 (keyframes) + Step 3.2 |
| Text avoidance (spostamento + fade) | Task 1 (hook) + Task 3, Step 3.2 (CSS) |
| Touch target espanso | Task 3, Step 3.2 (`::after`) |
| Tap feedback | Task 3, Step 3.2 (`:active`) |
| Nodi atmosferici `pointer-events: none` | Task 3, Step 3.2 |
| Desktop invariato | Design: tutte le modifica sono dentro `@media (max-width: 767px)` |
| Altre pagine invariate | Design: solo `vibe-home-v2.tsx` e `globals.css` specifico |

### Placeholder scan

- Nessun "TBD", "TODO", "implement later".
- Codice completo in ogni step.
- Comandi esatti con expected output.

### Type consistency

- `useTextAvoidance` accetta `React.RefObject<HTMLElement | null>` — coerente con `useRef<HTMLDivElement>(null)`.
- Classi CSS `.home-orbit-node--principal`, `--secondary`, `--atmospheric` usate consistentemente in TSX e CSS.
