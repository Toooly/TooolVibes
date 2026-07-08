# TooolVibes — Component Specification

## Primitives (Figma-SoT)

### Button — P0
- **Varianti:** primary / secondary / ghost / destructive / icon-only
- **Stati:** default / hover / focus / active / disabled / loading
- **Size:** sm(32px) / md(40px) / lg(48px)
- **Auto-layout:** Hug contents, padding orizzontale variante, gap 8px icona-label
- **Note:** Loading = spinner 16px centrato + label opacizzata. Icon-only = quadrato fisso. Disabled = opacity 50%.

### Badge — P0
- **Varianti:** neutral / accent / success / warning / danger / info
- **Stati:** default / hover
- **Auto-layout:** Hug contents, padding 4px 8px
- **Note:** Pill opzionale per badge filtro selezionato. Non usare per stati complessi.

### Input — P0
- **Varianti:** text / search / textarea / select / checkbox / radio / switch
- **Stati:** default / hover / focus / active / disabled / error / valid
- **Auto-layout:** Vertical (label + input + helper), input Fill container
- **Note:** Search = icona lente + padding-left aumentato. Error = bordo danger + caption messaggio.

### Modal — P0
- **Varianti:** default / large / confirmation / form
- **Stati:** default / entrance / exit (annotati)
- **Auto-layout:** Vertical (header/body/footer), body scrollable
- **Note:** Header = titolo + close icon-only. Footer = azioni primarie dx (desktop), stack full-width (mobile). Backdrop annotato. Max-width: 480px mobile, 640px desktop.

### Tooltip — P1
- **Varianti:** top / bottom / left / right
- **Stati:** default
- **Auto-layout:** Hug contents, padding 8px 12px
- **Note:** Freccetta verso trigger. Mobile = bottom sheet info alternativa.

### BottomSheet — P1
- **Varianti:** default / expanded / peek
- **Stati:** default / drag (annotato)
- **Auto-layout:** Vertical, handle drag visibile (40px x 4px, centrato, pill)
- **Note:** Mobile primario. Tablet = lasciare margini visibili. Animazione = Code-Only.

### Toast — P1
- **Varianti:** success / error / warning / info
- **Stati:** default / entrance / exit (annotati)
- **Auto-layout:** Horizontal (icona + testo + close), padding 12px 16px, max-width 400px
- **Note:** Mobile = bottom-center + safe-area. Desktop = top-right. Icona status obbligatoria.

### Avatar — P1
- **Varianti:** image / fallback (iniziali)
- **Stati:** default / hover
- **Size:** sm(24px) / md(32px) / lg(48px)
- **Note:** Fallback = iniziali maiuscole, font weight 600. Bordo opzionale online/verificato.

### Tabs — P1
- **Varianti:** default / pills / underline
- **Stati:** default / hover / active / disabled
- **Auto-layout:** Horizontal, ogni tab Hug contents
- **Note:** Underline = linea accent 2px sotto tab attiva. Pills = sfondo selected radius/pill. Mobile = scroll orizzontale.

### Accordion — P2
- **Varianti:** default / bordered / filled
- **Stati:** collapsed / expanded / hover / disabled
- **Auto-layout:** Vertical, header fixed, body Hug
- **Note:** Chevron ruota 180° in expanded (annotato). Non usare per navigazione principale.

## Compositi (Figma-SoT)

### Tool Card — P0
- **Varianti:** default / compact / featured / horizontal
- **Stati:** default / hover (lift) / focus / selected / loading skeleton
- **Dipendenze:** Badge, Button icon-only, Avatar
- **Note:** Hover = elevation/raised, lift max 2px. Selected = bordo/sfondo accent. Mobile = layout verticale, tap target 44px.

### Editorial Card — P1
- **Varianti:** default / featured (hero) / compact
- **Stati:** default / hover / focus
- **Dipendenze:** Badge (opz), Avatar autore
- **Note:** Featured = immagine full-bleed top + testo overlay con gradient. Caption per byline.

### Compare Row — P1
- **Varianti:** default / highlight-winner / category-header
- **Stati:** default / hover
- **Dipendenze:** Tool Card compact, Badge
- **Note:** Mobile = stack verticale o scroll orizzontale. Winner = bordo accent + sfondo tintato.

### Header / Nav — P0
- **Varianti:** default / scrolled / mobile (hamburger) / auth
- **Stati:** default / hover / active / focus / mobile-open
- **Dipendenze:** Button, Input search, Avatar
- **Note:** Scrolled = elevation/raised + sfondo opaco. Mobile = hamburger overlay full-screen. Search integrata o espandibile.

### Footer — P1
- **Varianti:** default / minimal
- **Stati:** default / hover (link)
- **Dipendenze:** Input, Button, Icon
- **Note:** Disclosure affiliate obbligatoria. Newsletter = input + button inline (desktop), stack (mobile).
