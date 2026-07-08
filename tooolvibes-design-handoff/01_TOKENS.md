# TooolVibes — Design Tokens Reference

## Color Tokens

| Token | Valore | Uso |
|-------|--------|-----|
| `color/bg/base` | `#0F0F12` | Sfondo pagina, canvas app |
| `color/surface/raised` | `#1A1A1E` | Card, modal, dropdown, toast |
| `color/surface/elevated` | `#25252B` | Hover states, dropdown open |
| `color/ink/primary` | `#F3F3F7` | Testo principale, titoli, label |
| `color/ink/secondary` | `#A0A0B0` | Sottotitoli, meta, breadcrumb |
| `color/ink/muted` | `#6E6E7E` | Placeholder, caption, disabled |
| `color/accent/primary` | `#8B5CF6` | CTA primari, link, badge accent |
| `color/accent/hover` | `#7C3AED` | Hover button primary, link hover |
| `color/accent/pressed` | `#6D28D9` | Stato pressed/active CTA |
| `color/status/success` | `#22C55E` | Conferme, toast success, badge ok |
| `color/status/warning` | `#F59E0B` | Avvisi, azioni che richiedono attenzione |
| `color/status/danger` | `#EF4444` | Errori, azioni distruttive, rimozione |
| `color/status/info` | `#3B82F6` | Info neutre, tooltip informativi |
| `color/focus/ring` | `#06B6D4` | Focus ring accessibilità, keyboard nav |

## Typography Tokens

| Token | Valore | Uso |
|-------|--------|-----|
| `font/ui/family` | Inter | Tutto il testo UI |
| `font/ui/weight/400` | Regular | Body text, descrizioni |
| `font/ui/weight/500` | Medium | Label, button text, nav item |
| `font/ui/weight/600` | SemiBold | Button CTA primario, nav active |
| `font/display/family` | Fraunces | Heading editoriali, titoli hero |
| `type/size/caption` | 12px / 0.75rem | Caption, meta-info, footnote |
| `type/size/body` | 16px / 1rem | Corpo testo principale |
| `type/size/lead` | 18-20px | Intro/lead paragraph |
| `type/size/h3` | 20-24px | Sezione heading, card title |
| `type/size/h2` | 28-32px | Page section heading |
| `type/size/h1` | 36-40px | Page title (non hero) |
| `type/size/display` | 48-64px | Hero title, mega-heading |
| `type/line-height/tight` | 1.1-1.2 | Heading, display, badge |
| `type/line-height/normal` | 1.5-1.6 | Body text, lead |
| `type/line-height/loose` | 1.7-1.8 | Editorial long-form |
| `type/tracking/tight` | -0.02em | Display, large headings |
| `type/tracking/default` | 0em | Default per tutto il testo |
| `type/tracking/wide` | 0.05-0.1em | Label uppercase, badge, caption all-caps |

## Spacing Tokens

| Token | Valore | Uso |
|-------|--------|-----|
| `space/1` | 4px | Micro-gap, icona-testo stretto |
| `space/2` | 8px | Padding interno badge, gap compatti |
| `space/3` | 12px | Gap standard componenti |
| `space/4` | 16px | Padding componente standard |
| `space/6` | 24px | Spazio tra sezioni interne |
| `space/8` | 32px | Spazio sezione-card |
| `space/12` | 48px | Spazio tra sezioni pagina |
| `space/16` | 64px | Grande spazio sezione |
| `space/24` | 96px | Spazio hero/sezione |
| `space/32` | 128px | Spazio massimo pagina |

## Radius Tokens

| Token | Valore | Uso |
|-------|--------|-----|
| `radius/sm` | 6px | Badge, tag, chip |
| `radius/md` | 10px | Button, input, card |
| `radius/lg` | 16px | Modal, bottom sheet, pannelli |
| `radius/pill` | 999px | Button pill, chip, avatar |

## Elevation Tokens

| Token | Valore | Uso |
|-------|--------|-----|
| `elevation/rest` | none / 0 1px 2px rgba(0,0,0,0.05) | Card a riposo |
| `elevation/raised` | Ombra media | Card hover, dropdown aperto |
| `elevation/modal` | Ombra forte + backdrop | Modal, bottom sheet, toast |

## Motion Tokens (Code-Only)

| Token | Valore | Uso |
|-------|--------|-----|
| `motion/duration/fast` | 120ms | Micro-interazioni |
| `motion/duration/base` | 180ms | Transizioni standard |
| `motion/duration/slow` | 280ms | Animazioni page-level |
| `motion/easing/standard` | cubic-bezier(.2,0,0,1) | Maggior parte transizioni |
| `motion/easing/emphasis` | cubic-bezier(.4,0,.2,1) | Bottom sheet, toast |

---
*Totale token: 52 (12 P0, 30 P1, 7 P2, 5 Code-Only)*
