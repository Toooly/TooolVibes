# REPORT_AGENT_ANALYSIS_REQUESTS_BY_SECTION

Modalita: AUDIT / PLANNING read-only. Fonti: tutti i 25 Markdown agent/checklist/prompt piu ispezione statica del repository.

## Mappa richieste per sezione prodotto

| Sezione | Route/file principali | Richieste agenti | Output atteso |
|---|---|---|---|
| Home / brand entry | `app/(marketing)/page.tsx`, `components/home/*` | Chiarezza valore, gerarchia, no effetto decorativo dominante, trust above fold | Audit full, visual, desktop/mobile |
| Catalogo / Discovery | `app/(marketing)/archivio/page.tsx`, `components/directory/*` | Ricerca, filtri, chip, stati empty, salvare/confrontare, lista semantica | Audit mobile/desktop, UX, componenti |
| Tool detail | `app/(marketing)/toools/[slug]/page.tsx` | Fonte, last reviewed, CTA, compare/shortlist, copy decisionale | Trust, conversion, UX, Figma hero page |
| Compare | `app/(marketing)/compare/page.tsx`, `components/tools/*compare*` | 2-4 tool ideali, <=6 dimensioni, leggibilita mobile/desktop | Desktop/mobile findings, backlog |
| Shortlist / Wishlist | `app/(marketing)/shortlist/page.tsx`, `app/(marketing)/wishlist/page.tsx` | Persistenza anonima, account sync, empty state, azioni chiare | UX flow, frontend risk |
| Editorial / Blog | `app/(marketing)/posts/[slug]/page.tsx`, `lib/types/article.ts` | Byline, fonti, affiliate disclosure, related tools | Trust, content system, Figma reference/SoT |
| Collections / categorie | `app/(marketing)/collections/*`, `app/(marketing)/tags/page.tsx` | Navigabilita, scan, coerenza card e taxonomy | Full audit, Figma reference |
| Radar / Product Hunt | `app/(marketing)/radar/page.tsx`, `app/(marketing)/product-hunt/page.tsx` | Stato sperimentale, densita, segnali, keyboard | Visual, desktop/mobile |
| Shop / offerte | `app/(marketing)/shop/page.tsx`, monetization components | Trasparenza commerciale, CTA esterne, pricing/prova sociale | Trust/conversion, open questions |
| Chi siamo / metodo / affiliati | `app/(marketing)/chi-siamo/page.tsx`, `metodo`, `affiliati` | Autorita editoriale, policy, promessa di curation | Trust, visual reference |
| Account / auth | `app/(marketing)/account/page.tsx`, `app/auth/callback` | Non modificare auth; audit solo UI stati | Frontend risk, code-only |
| Admin | `app/admin/**` | Fuori SoT marketing; audit solo rischi UI macro | Code-only/reference |
| System states | `app/not-found.tsx`, `app/error.tsx` | Empty/error/loading coerenti | Full audit, componenti |
| Design system | `app/globals.css`, `components/ui/*`, `styles/*` | Token inventory, varianti, radius, shadow, focus, primitives | DS/component/Figma |

## Coordinamento specialisti applicato

- Visual Design Director: palette, radius, effetti, gerarchia.
- UX Flow Auditor: discovery -> detail -> save -> compare -> account.
- Design System Architect: token/primitive/component governance.
- Mobile UI Specialist: 320/375/414/768, target, overlay, sticky.
- Figma Handoff Specialist: SoT, Reference, Code Only.
- Frontend Implementation Reviewer: stato, storage, CSS globale, rischio diff.
- Conversion and Trust Reviewer: affiliate, fonte, last reviewed, byline.
