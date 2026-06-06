# Design Spec: Pallini Mobile Home — Rifunzionalizzazione Orbital

**Data**: 2026-06-05  
**Stato**: Approvato  
**Autore**: AI Design Session  
**Scope**: Solo mobile Home (`<768px`). Desktop, altre pagine, backend, API, route, dati, auth immutati.

---

## 1. Contesto

Il sistema attuale dei pallini sulla Home mobile (`vibe-home-v2.tsx`) soffre di:
- Ammassamento: nodi troppo vicini su anelli piccoli
- Mancanza di gerarchia: tutti i nodi hanno dimensioni simili
- Clickability poco chiara: l’utente non intuisce quali siano cliccabili
- Sovrapposizione con testi durante lo scroll
- Ruolo decorativo prevalente rispetto a quello funzionale

## 2. Obiettivo

Trasformare i pallini da decorazione passiva a **sistema di guida attivo** che:
- accompagna l’utente nel percorso della Home
- comunica chiaramente gerarchia e funzione
- evita di coprire contenuti testuali
- mantiene il feeling fluttuante/orbitale

## 3. Architettura — Orbita Espansa

Ogni sezione orbitale della Home mobile adotta **2 anelli concentrici espansi**:

| Anello | Nodi | Dimensione visiva | Funzione | Raggio orbitale |
|--------|------|-------------------|----------|-----------------|
| **Interno** | 2 | 52–56px | Principali — cliccabili, portano a sezioni/tool | 110–130px |
| **Esterno** | 3 | 28–36px | Secondari/hint | 170–200px |

### 3.1 Regole spaziali
- Distanza minima tra qualsiasi coppia di nodi: **≥ 20px**
- Distanza minima nodi–bordi viewport: **≥ 24px**
- Sovrapposizione inter-anello: vietata per costruzione (raggi ben distanziati)

### 3.2 Movimento
- Velocità di rotazione diversa per anello: interno più lento, esterno più veloce
- Velocità globali ridotte del **25%** rispetto all’attuale per ridurre confusione
- Animazione CSS `tv-catalog-saturn-orbit` mantenuta, parametrizzata per anello

## 4. Gerarchia Visiva

### 4.1 Pallini principali (anello interno, 2 nodi)
- **Dimensione**: 52–56px visibile
- **Touch target**: nativo 44px minimo (soddisfatto)
- **Indicatore di importanza**:
  - Glow pulsante continuo (box-shadow `0 0 12px → 0 0 28px`, ciclo 2.2s)
  - Opacità piena (1.0)
  - Bordo più spesso (2px) e opaco
- **Contenuto**: nessuna icona né testo (scelta utente: pulizia visiva massima)
- **Comportamento**: cliccabili, portano a sezioni o pagine

### 4.2 Pallino secondario cliccabile (anello esterno, 1 nodo)
- **Dimensione**: 32–36px visibile
- **Touch target**: espanso a 48px via pseudo-elemento `::after` invisibile
- **Indicatore**: bordo leggermente più opaco degli atmosferici, opacità 0.85
- **Comportamento**: cliccabile, funzione hint/accesso secondario

### 4.3 Pallini atmosferici (anello esterno, 2 nodi)
- **Dimensione**: 28–32px visibile
- **Touch target**: non interattivo (nessuna espansione)
- **Indicatore**: opacità costante 0.4, bordo sottile e sfumato
- **Comportamento**: puramente decorativi, parte della "via lattea"

## 5. Text Avoidance (Evitamento Testo)

### 5.1 Problema
I nodi orbitano in posizioni CSS fisse e possono sovrapporsi a testi o CTA durante lo scroll.

### 5.2 Soluzione: Hook `useTextAvoidance`

Implementato in `vibe-home-v2.tsx`:

1. **Marcatura**: elementi testuali significativi ricevono `data-text-zone="true"`:
   - Titoli sezionali (`<h2>`, `<h3>`)
   - Paragrafi descrittivi
   - CTA button
   - Header fisso e bottom nav

2. **Calcolo** (throttled a 16ms su `scroll`):
   - Per ogni nodo orbitale: leggi `getBoundingClientRect()`
   - Per ogni text zone: leggi `getBoundingClientRect()`
   - Calcola percentuale di sovrapposizione (intersection area / node area)

3. **Reazione** (se sovrapposizione > 30%):
   - Aggiungi classe `.home-orbit-node--avoiding`
   - Effetti CSS applicati:
     - `translateX(±40px)` verso il lato libero più vicino
     - `opacity: 0.35`
     - `scale(0.6)`
     - `transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1)`

4. **Ripristino**:
   - Quando sovrapposizione scende sotto 10% o text zone esce dalla viewport
   - Rimozione classe, ritorno a stato orbitale normale

### 5.3 Eccezioni
- Nodi atmosferici (opacità 0.4) non si spostano: sono già sufficientemente trasparenti
- Nodi principali sono quelli con reazione più marcata

## 6. Microinterazioni

| Microinterazione | Implementazione | Target |
|------------------|-----------------|--------|
| **Floating** | CSS `translateY(±6px)`, 3.5s, ease-in-out, infinito, `animation-delay` sfasato per nodo | Tutti i nodi |
| **Pulsazione glow** | CSS `@keyframes` box-shadow `0 0 12px → 0 0 28px`, 2.2s, infinito | Solo principali |
| **Tap feedback** | `:active` → `scale(0.92)` + `box-shadow` intensificato, 150ms | Nodi cliccabili |
| **Hover (mobile)** | Nessun hover nativo; il tap è l’unico trigger | — |

### 6.1 Performance
- Tutte le animazioni su `transform` e `opacity` (compositing-only)
- `will-change: transform` sui nodi principali
- Nessun trigger di layout o paint
- Throttling 16ms sul listener scroll per text avoidance

## 7. Mobile-Native Checklist

- [x] Touch target principali: ≥ 44px (nativo)
- [x] Touch target piccoli cliccabili: 48px via pseudo-elemento
- [x] Spacing inter-nodi: ≥ 20px
- [x] Spacing bordi: ≥ 24px
- [x] Nessun elemento < 28px visibile
- [x] Nessuna sovrapposizione con testo (text avoidance)
- [x] Nessun layer che blocchi tap (`pointer-events` gestito correttamente)
- [x] Nessuno scroll orizzontale indotto
- [x] Animazioni leggere, niente lag atteso

## 8. File da Modificare

| File | Modifiche |
|------|-----------|
| `components/home/vibe-home-v2.tsx` | Ristrutturazione anelli (2 anelli espansi), hook `useTextAvoidance`, classi gerarchiche condizionali per tipo nodo |
| `app/globals.css` | Stili anelli espansi `@media (max-width: 767px)`, keyframes floating/pulsazione, stili `.home-orbit-node--avoiding`, touch target espansi |
| `components/app/orbital-system/orbital-shapes.tsx` | *Opzionale*: aggiunta variante shape leggera per nodi atmosferici (se necessario per differenziare visivamente) |

## 9. Cosa NON Viene Toccato

- Desktop (`md:` breakpoint e superiori)
- `OrbitalLayer` globale (`components/app/orbital-system/orbital-layer.tsx`)
- Altre pagine (Radar, Catalogo, Wishlist, Suggerisci, Admin)
- Backend, API, route, link esistenti, dati, auth
- Logiche generali di business
- Contenuti testuali della Home (solo markup `data-text-zone` aggiunto)

## 10. Test di Accettazione

- [ ] Su mobile, i pallini non sono più ammassati
- [ ] I pallini hanno gerarchia visiva chiara (2 grandi, 1 medio, 2 piccoli)
- [ ] I 2 principali emergono chiaramente come più importanti
- [ ] I 3 cliccabili (2 principali + 1 secondario) sono intuibili
- [ ] Touch target adeguato al dito (nessun elemento troppo piccolo da toccare)
- [ ] Durante lo scroll, i pallini non coprono testi o CTA
- [ ] La Hero mobile risulta più chiara e ordinata
- [ ] Il feeling fluttuante/orbitale è mantenuto
- [ ] Il risultato sembra mobile-native
- [ ] Desktop non è alterato
- [ ] Altre pagine non sono rotte

## 11. Note Implementative

- Il sistema attuale usa variabili CSS inline (`--node-size`, `--orbit-angle`). Queste verranno estese con `--orbit-ring` (interno/esterno) e `--node-type` (principal/secondary/atmospheric).
- Il text avoidance usa un listener `scroll` throttled. Se il progetto ha già un hook di scroll ottimizzato (es. `useScroll` o `useIntersectionObserver`), preferire quello invece di aggiungere un nuovo listener.
- I nodi atmosferici usano `pointer-events: none` per evitare tap accidentali.
- La variante `home-orbit-node--compact-extra` (che nasconde nodi su mobile) verrà rimossa o adattata: su mobile tutti i 5 nodi sono visibili, ma con gerarchia differenziata.
