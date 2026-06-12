# Gamification UI/UX Polish — Design Spec

**Date:** 2026-06-08  
**Scope:** VibeTapMiniGame header launcher + modal, mobile Arena fight scene, mobile comparison matrix.  
**Direction:** Coerente premium — glassmorphism integrato al resto di Toolvibes, motion spettacolare ma controllato.

---

## 1. Goals

- Rafforzare la percezione che Toolvibes sia un **ambiente interattivo**, non solo una directory.
- Rendere le meccaniche di gioco **visivamente coerenti** con il design system esistente.
- Migliorare **leggibilità, feedback e delight** in tre aree: header mini-game, arena fight e matrice mobile.
- Mantenere le animazioni **spettacolari ma performanti**, con fallback per `prefers-reduced-motion`.

---

## 2. Design Direction

**Tono:** glassmorphism premium + accenti di gioco.
**Palette:** colori di brand esistenti (`--accent-purple`, `--cyan`, `--gold`) più due token specifici:
- `--game-danger` per timer sotto i 3 secondi.
- `--game-success` per combo/milestone positive.
**Motion:** spring per aperture, scale+bounce per interazioni, glow pulse per stati attivi, confetti su vittorie. Tutto basato su `transform`/`opacity` per 60 fps.
**Scope:** tutti e tre i pezzi (Vibe Rush, Arena fight, matrice mobile).

---

## 3. Vibe Rush Header & Modal

### 3.1 Launcher

- **Pill button** con sfumatura viola→ciano, bordo vetro, icona Play animata (pulse soft).
- **Label “Vibe Rush”** visibile su desktop; su mobile solo orb + dot dorato.
- **Micro-badge dinamico**: il dot dorato può mostrare “NEW!” o il punteggio giornaliero quando c’è attività aperta.
- Posizionato in `SiteHeaderV2` tra logo e brand wordmark, come feature in evidenza.

### 3.2 Modal

- **Backdrop**: blur scuro (`rgba(11,7,28,0.56)`), `backdrop-filter: blur(14px)`.
- **Panel**: gradiente radiale viola, bordo sottile bianco/cristallo, max-width 24 rem, radius 30 px.
- **Header**: titolo grande “Vibe Rush”, sottotitolo e icona X.
- **Stats**: tre chip glass per Score, Combo, Time.
- **Timer**: anello circolare che si svuota progressivamente (12 s).
- **Stage**: area ~20 rem con griglia sottile, glow centrale dinamico.
- **Targets**: spawnano con animazione `scale(0)` → `scale(1)` + fade da posizioni casuali, invece di saltare bruscamente.
- **Hit feedback**: numero “+N” che vola verso l’alto; combo ×2/×3 in oro.
- **End screen**: confetti, riepilogo “Vibe collected”, XP guadagnato, CTA “Gioca ancora” e “Chiudi”.

---

## 4. Arena Fight Scene

### 4.1 Idle

- Ring 3D con griglia al suolo e core centrale pulsante.
- I tool compaiono come “fighter” disposti automaticamente in base al count:
  - 2: frontali, uno di fronte all’altro.
  - 3: triangolo.
  - 4: ai vertici di un quadrato.
  - 5: a pentagono.
- Ogni fighter ha:
  - orb gradiente con accenti del tool.
  - nome tool sopra.
  - mini score sotto.

### 4.2 Fighting

- Core che diventa **vortice luminoso**.
- Fighter con **shake controllato**.
- Linee sottili di energia che collegano ogni fighter al centro.
- Barra o testo “Clash in corso…” — preferibilmente visivo (icona + progresso), non testo grezzo.

### 4.3 Result

- Sfondo del ring si tinge d’oro.
- Vincitore si **ingrandisce** e prende un **alone dorato**.
- Altri fighter si scuriscono/affievoliscono.
- Banner “Winner” con nome del tool leggibile e badge.
- CTA “Rigioca” e, se disponibile, “Vai alla scheda”.

### 4.4 Adattivo

- Su schermi piccolissimi gli fighter si ridimensionano.
- I nomi tool diventano tooltip per evitare sovrapposizioni.

---

## 5. Mobile Comparison Matrix

### 5.1 Layout

- **Header sticky** in cima con i nomi dei tool.
- **Scroll orizzontale condiviso**: scrollare una riga muove tutte le altre, mantenendo l’allineamento colonna.
- Ogni riga:
  - label dell’attributo **fissa a sinistra**.
  - celle scrollabili a destra.
- In ogni cella:
  - **valore grande** in primo piano.
  - nome tool piccolo sotto.
  - **barra relativa** all’attributo per leggere immediatamente chi è forte.
  - mini badge “WIN” dorato per il tool che vince quella riga.

### 5.2 Stati

- Riga hover/focus: leggero highlight di sfondo.
- Cella vincente: bordo/bagliore oro tenue.

---

## 6. Motion & Accessibility

### 6.1 Animazioni

| Elemento | Animazione | Durata / Easing |
|----------|------------|-----------------|
| Modal open | `scale(0.95)`→`1`, `opacity` 0→1, backdrop blur fade | 300 ms spring |
| Target spawn | `scale(0)`→`1`, `opacity` 0→1 | 250 ms ease-out-back |
| Hit feedback | `+N` translateY -2 rem, opacity out | 600 ms ease-out |
| Combo badge | scale pop 1→1.2→1 | 300 ms spring |
| Fighter shake | translateX/Y ±2 px loop | fighting state |
| Winner glow | box-shadow pulse oro | result state |
| Confetti | canvas-confetti su vittoria/completion | 1 s burst |

### 6.2 Accessibilità

- `prefers-reduced-motion`: disabilitare confetti, shake e pulse; mantenere solo fade/opacity.
- `aria-live` per annunciare score/combo/tempo nel mini-game.
- Target e fighter con `aria-label` univoco (non ripetuto).
- Focus trap nella modal di Vibe Rush.
- Contrasto WCAG 4.5:1 per testi sui chip e nelle celle.

---

## 7. Files Affected

- `components/gamification/vibe-tap-mini-game.tsx`
- `components/layout/site-header-v2.tsx`
- `components/tools/mobile-compare-view.tsx`
- `components/gamification/arena-battle-stage.tsx` (eventuale allineamento stili)
- `app/globals.css`
- `lib/config/sound.ts` / sound layer (eventuali nuovi SFX per hit/combo/winner)

---

## 8. Non-Goals

- Non ridisegnare il backend delle battaglie.
- Non aggiungere nuove meccaniche di gioco (nuovi missioni, livelli, badge).
- Non cambiare la navigazione dell’header.

---

## 9. Success Criteria

- Vibe Rush ha un aspetto premium, invita al click e dà feedback immediato.
- Arena fight è scenografica, leggibile da 2 a 5 tool e celebra il vincitore.
- Matrice mobile è leggibile senza perdere l’allineamento tra righe.
- Test e lint passano; nessun regressione su mobile/desktop.
