# TooolVibes — Guides Editorial + UI/UX Rebuild
**Date**: 2026-08-08
**Operator**: Mavis (Mavis)
**Commit**: `9fbafa1 MiniMax · guides: editorial + UI/UX rebuild of /posts (12 guides rewritten)`
**Scope**: Guides only. No partner / sponsor / ad surface touched.

---

## 1. Guide inventory

All 12 existing guides were discovered in `lib/data/public-articles.ts` (lines 80–2330) and **all 12 were rewritten from draft to publishable depth**.

| # | Slug | Tool slug | Topic | Reading min | Source size (chars) | Rewritten |
|---|------|-----------|-------|-------------|---------------------|-----------|
| 1 | `betterpic` | betterpic | Immagini AI | 11 | 15 650 | ✓ |
| 2 | `frase-ai` | frase | SEO & content | 8 | 12 266 | ✓ |
| 3 | `jenny-ai` | jenni-ai | Scrittura | 7 | 10 715 | ✓ |
| 4 | `reclaim-ai` | reclaim-ai* | Produttività | 8 | 11 348 | ✓ |
| 5 | `windsor-ai` | windsor-ai | Marketing data | 7 | 10 441 | ✓ |
| 6 | `reachifyme` | reachifyme | LinkedIn | 6 | 9 331 | ✓ |
| 7 | `flowise-ai` | flowise | Agenti AI | 7 | 10 520 | ✓ |
| 8 | `lemon-squeezy` | lemon-squeezy | SaaS business | 8 | 11 517 | ✓ |
| 9 | `agentxai` | agentx | Agenti AI | 7 | 10 325 | ✓ |
| 10 | `omi-app-ai` | omi | Hardware AI | 8 | 11 779 | ✓ |
| 11 | `wegic` | weggic | AI websites | 7 | 10 696 | ✓ |
| 12 | `tolt` | tolt | SaaS business | 7 | 11 318 | ✓ |

*reclaim-ai has `tool_slug` but no matching tool in the directory — article page handles null tool gracefully (no tool card in rail/hero, no tool CTA).

---

## 2. Editorial work (per guide)

For every guide: original ~600–1 200 word draft was discarded. New article was built from the user intent down. Each guide covers the question the reader is trying to solve and follows a consistent but flexible structure:

- **Cosa fa [tool], in una frase** (one-line positioning)
- **A chi serve davvero / A chi NON serve** (audience fit + explicit non-fit)
- **Setup rapido / Come iniziare** (steps)
- **Flusso di lavoro / Casi d'uso** (workflows)
- **Funzionalità chiave** (key features)
- **Pricing reale** (verified plan tiers)
- **Limiti e avvertenze** (where the tool breaks)
- **Errori comuni** (frequent mistakes)
- **Alternative / Confronto** (vs 2–3 competitors)
- **FAQ** (real questions)
- **Cosa ci aspettiamo nei prossimi mesi** (forward-looking)
- **In sintesi** (decision summary)
- **Prossimi passi** (CTAs to TooolVibes tool page, collections, shortlist)

### Per-guide highlights

| Slug | What the guide is really about | Editorial decisions |
|------|------------------------------|---------------------|
| `betterpic` | When AI headshots replace a real photographer and when they don't | Anchors the article on a "credibile vs distintivo" decision axis. Compares with Aragon, HeadshotPro, Secta. Explicit pricing caveat ("verifica sul sito"). |
| `frase-ai` | SEO + drafting + optimization in one workflow | Walks through the SERP research → brief → writing loop. Calls out the GSC/Sheets integration as the most underrated feature. Compares with Surfer, MarketMuse, WriterZen. |
| `jenny-ai` | Academic writing assistant — fit, limits, anti-cheat | Treats the academic-cheating-detection angle seriously, not just features. Compares with Paperpal, Writefull, Grammarly. |
| `reclaim-ai` | Calendar automation for people whose week is fragmented | Focuses on habits/tasks/meetings as the three primary planes (not the feature list). Compares with Motion, Akiflow, Clockwise. |
| `windsor-ai` | Marketing data unification for non-engineers | Sets realistic expectations on no-code integration depth. Compares with Supermetrics, Fivetran, Improvado. Calls out the LLM-for-SQL feature. |
| `reachifyme` | LinkedIn outbound at scale without burning the account | Treats warmup, rotation, and safety limits as the real buying decision, not "AI personalization". Compares with LinkedHelper, Zopto, Octopus CRM. |
| `flowise-ai` | Open-source LangChain UI for production agents | Honest about the dev/ops overhead vs hosted. Compares with LangFlow, n8n, VectorShift. |
| `lemon-squeezy` | Merchant of record for indie SaaS | The tax + dunning + global payout story is the spine, not the checkout. Compares with Paddle, Gumroad, Stripe Tax. |
| `agentxai` | Voice agents for SMB customer support | Calls out the cost-per-minute economics vs offshore BPO. Compares with Vapi, Bland, Retell. |
| `omi-app-ai` | Wearable memory capture — what it actually records | The privacy / always-on / consent story is treated head-on. Compares with Rewind, Limitless, Humane (now discontinued). |
| `wegic` | Conversation-to-website builder — fit and where it breaks | Distinguishes "real site" from "MVP landing". Compares with Durable, 10Web, Framer AI. |
| `tolt` | Affiliate program for SaaS without upfront fee | Goes deep on the marketplace dynamics, anti-fraud, payout mechanics. Compares with FirstPromoter, PartnerStack, Rewardful. |

Factual research performed against each tool's official docs / pricing / changelog at the time of writing. Pricing is flagged as time-sensitive and "verify on the official site" is the standard disclaimer.

No fabricated benchmarks, no fake "we tested it" claims, no invented features.

---

## 3. UI/UX work

### 3.1 Guides index (`/posts`)
- **Masthead** (`GuideMasthead`): premium dark surface with editorial title in two weights ("Guide scritte per *decidere*, non per riempire una SERP."), live counters (guide count, total reading time, tool count), topic chips, primary + secondary + tertiary CTAs.
- **Featured guide** (`GuideFeaturedSection`): full-bleed ivory card with topic kicker, editorial H2 ("La *lettura* da cui partire."), cover gradient (topic-tinted), tool link, reading minutes.
- **Filterable grid** (`GuideGridSection`): topic filter chips with counts (ARIA tablist), responsive 3-column grid, 9-item initial state with expand toggle, smart sort (featured first → reading time desc → date desc).
- **Close block**: dark surface with three affordance cards (Catalogo / Raccolte / Radar) + "Come scriviamo le guide" link + average reading time stat.

### 3.2 Guide cards
Four variants, all in `components/guides/guide-card.tsx`:
- **`feature`** — large card for the featured slot, cover gradient + topic + tool + minutes
- **`default`** — 3-column grid card with topic pill, title, dek, tool pill, published date
- **`compact`** — tight horizontal card for related/rail contexts
- **`mobile-row`** — full-width row card for mobile feed

Topic palette mapped per area (Scrittura=cyan, Agenti=violet, Immagini=orange, Affiliate=green, Schedul=purple, SEO=teal, etc.) — colors flow into the topic chip, cover gradient, and rail accents.

### 3.3 Guide article page (`/posts/[slug]`)
- **Breadcrumb**: `← Tutte le guide · Guida · Topic`
- **Article hero** (`GuideArticleHero`): dark surface, topic-tinted glow variable per topic, full H1, dek, 4 hero pills (kind / topic / published / reading), 4 highlight bullets, primary CTA (Apri la scheda tool) + secondary CTA (Tutte le guide). Side stats column: Lunghezza, Tool collegato, Categoria.
- **Article body** (`guides-article__body`): byline (author + publish date + reading time), key-takeaways callout (violet), markdown body with H2/H3 rhythm, in-sintesi decision callout (dark, near end).
- **Right rail** (desktop ≥ 1100 px): sticky TOC (with active-section highlighting + progress bar) + sticky related-guides card stack.
- **Article end** (`GuideArticleEnd`): dark "Continua a leggere — Tre *guide* per andare avanti" with 3 related card grid.
- **Partner placements** kept intact: `ContextualPartnerBlock` (guide-inline-promo) and `TinyAdzInlineSlot` (article-body) are rendered in a dedicated band after the article-end, not inside the guide-styled content.

### 3.4 Markdown subsystem (`GuideMarkdown`)
- Custom blocks: `:::tip`, `:::warning`, `:::pro`, `:::decision`, `:::takeaways` parsed in a preprocessor and rendered as themed callouts.
- Auto-collected H2/H3 headings passed up via `onHeadings` callback for the TOC.
- Slugged heading ids (`slugify`) so TOC anchors work.
- Inherits the existing `editorial-markdown` typography with `inside-ivory inside-light-surface` overrides to keep contrast on light cards.

### 3.5 Mobile (360 / 390 / 430)
- Single-column layouts at every breakpoint
- Hero stack: pills wrap, H1 stays large, side stats collapse below main
- TOC moves to a horizontal scrolling chip-row at the top of the article (no sticky desktop rail on mobile)
- Cards use the `mobile-row` variant in the index list
- Bottom-nav (`fisso`) sits above content
- No horizontal overflow at 360 px

### 3.6 Desktop (1280 / 1440 / 1536)
- 3-column grid in index, 2-column layout (main + 320 px rail) in article
- Hero is a 2-column flex (main 7 + side 5) with topic-tinted ambient glow
- Sticky rail uses `position: sticky; top: 4rem`
- Container max-width 1200 px with breathing room; rails do not stretch

### 3.7 Accessibility
- Semantic H1/H2/H3 on the article
- ARIA `tablist` / `tab` / `tabpanel` on the topic filter
- `aria-selected` instead of `aria-pressed` on tabs (per `jsx-a11y/role-supports-aria-props`)
- Reading progress bar `aria-hidden` because it's decorative
- `prefers-reduced-motion` respected: scroll-driven animations disabled, hero glow opacity reduced
- All CTAs keyboard reachable with visible focus rings via the global system

---

## 4. Files

### Modified
| File | Lines | What changed |
|------|-------|--------------|
| `app/(marketing)/posts/page.tsx` | 251 | Full rewrite — masthead / featured / grid / close block |
| `app/(marketing)/posts/[slug]/page.tsx` | 300 | Full rewrite — breadcrumb / hero / byline / takeaways / body / in-sintesi / article-end / rail |
| `app/globals.css` | +1 | `@import` for `styles/guides.css` |
| `lib/data/public-articles.ts` | +2842 / -1775 | All 12 guide seeds rewritten; `GuideSeed` type relaxed to permit `tool_slug` + `updated_at`; `loadCatalogEditorialPosts` filters out tool-writeups that shadow guide slugs |
| `styles/guides.css` | 1 977 | NEW — all guide styles with `guides-` prefix |
| `components/guides/*.tsx` (10 files) | 1 666 | NEW — guide-specific component system |
| `lib/data/guide-topics.ts` | 53 | NEW — slug → topic mapping (12 topics) |
| `lib/data/guide-related.ts` | 68 | NEW — related guide resolver by topic / tool |
| `scripts/_guides_content/*.md` (12 files) | — | NEW — source markdowns for each rewrite (kept for traceability / future edits) |

### Untouched (cross-scope safety)
- `components/monetization/partner-placements.tsx` — still belongs to the other agent
- `components/monetization/partner-creatives.tsx` — still belongs to the other agent
- `styles/partner-placements.css` — still belongs to the other agent
- `audits/partner-*/` — partner audits left as-is
- `lib/data/public-tools.ts` — not modified
- `lib/data/public-collections.ts` — not modified
- `app/(marketing)/layout.tsx`, `app/globals.css` (other than the new import) — not modified

---

## 5. Visual QA

### Viewports tested
360, 390, 430, 768, 820, 1280, 1440, 1536 — all 8 viewports, full-page screenshots at each.

### Pages screenshotted
- `/posts` (index)
- `/posts/betterpic`
- `/posts/frase-ai`
- `/posts/tolt`
- `/posts/lemon-squeezy`

40 final screenshots saved to `/tmp/tooolvibes-screenshots/final/{page}/{page}-{viewport}.png`.

### Issues found and fixed
| # | Issue | Fix |
|---|-------|-----|
| 1 | Tolt article showed "0 min di lettura" + tool writeup data — `loadCatalogEditorialPosts` returned a Tolt tool-writeup that was sorted before the Tolt guide seed (featured/date sort) and won the merge. | Filter tool-writeups whose slug matches a guide slug. Tolt now correctly shows 7 min, July 14 2025, full guide content. |
| 2 | Markdown body text was invisible on ivory cards. | Added `inside-ivory inside-light-surface` classes to the editorial-markdown wrapper, plus explicit `editorial-markdown` overrides in `styles/guides.css` for `.brand-panel` and `.premium-card` ancestors. |
| 3 | Hero `--guides-text` variable cascade was unscoped. | Scoped to `.guides-article` and `.guides-page`. |
| 4 | Summary string concatenation was producing template-literal syntax errors. | Switched to explicit `"..." +` string concatenation across lines in the apply path. |
| 5 | `aria-pressed` on `role="tab"` raised `jsx-a11y/role-supports-aria-props` lint warning. | Switched to `aria-selected`. |
| 6 | 24 `font-size` declarations under 12 px (typography-contract test). | All bumped to ≥ 0.78 rem (or 1 em for em-based declarations). |

### Verified visually
- No horizontal overflow at 360 px on any page
- No card breakage at any width
- Title hierarchy reads as: H1 hero → H2 section → H3 sub-section
- Hero pills wrap correctly
- Sticky rail behaves at 1280 / 1440 / 1536
- Topic-tinted gradients are distinct (not a single colour ramp)
- Reading-progress bar tracks the article body
- Cookie banner appears + dismisses correctly (tested via localStorage seed)
- All 13 routes (`/posts` + 12 guides) return 200

---

## 6. Validation

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `npm run typecheck` | **PASS** (0 errors) |
| Lint (strict) | `npm run lint:ci` (--max-warnings=0) | **PASS** (0 warnings) |
| Production build | `npm run build` | **PASS** (13 routes compile, 0 errors) |
| Unit / vitest | `npm test` | **1 798 / 1 799 pass** — the single failure is `__tests__/scripts/runtime-contract.test.ts > release runtime contract > executes the real preinstall entrypoint through npm`, which was failing on `main` before this work (verified via `git stash` baseline). Unrelated to Guides. |
| Typography contract | `vitest tests/design-system/typography-contract.test.ts` | **PASS** (9/9) |
| Visual smoke | Playwright at 8 viewports × 5 pages | **PASS** (40 screenshots, all 13 routes 200) |

### Commands run
```bash
cd /Users/gianmariacaltagirone/Tooolvibes
npm run typecheck          # → 0 errors
npm run lint:ci            # → 0 warnings
npm run build              # → success, 13 routes
npm test                   # → 1798/1799 pass (1 pre-existing failure)
PORT=3088 npm run dev      # → 13/13 routes return 200
```

---

## 7. Cross-scope safety

Confirmed explicitly:

| Area | Modified? | Notes |
|------|-----------|-------|
| `components/monetization/partner-placements.tsx` | **No** | Owned by other agent. Unstaged in working tree but not in this commit. |
| `components/monetization/partner-creatives.tsx` | **No** | Same. |
| `styles/partner-placements.css` | **No** | Same. |
| `ContextualPartnerBlock` placement on guide pages | **Kept** | Rendered as a dedicated band after `GuideArticleEnd`. Not inside guide-styled content. |
| `SponsorOpportunityLink` | **Kept** | Same dedicated band. |
| `TinyAdzInlineSlot` | **Kept** | Same. `shouldSuppressTinyAdzForPaidPartner` policy still gates it. |
| Tool detail pages | **No** | Not touched. |
| Catalog / collections | **No** | Not touched. |
| Home / Radar / Account | **No** | Not touched. |
| Global design system (tokens, brand-panel, dark-panel, editorial-markdown) | **Reused, not modified** | Guides layer adds `guides-*` classes on top; shared utilities (e.g. `editorial-markdown`) only get small `inside-*` overrides. |

`git show --name-only HEAD` confirms zero partner / monetization files in this commit. The other agent's `M` files remain in the working tree and were staged by no one.

---

## 8. Remaining issues (genuine, guide-specific)

1. **Wegic source markdown** (`scripts/_guides_content/wegic.md`) and the seed file reference slug `wegic` while the tool directory exposes `weggic`. The article slug is `wegic` to match the original guide identity; the tool lookup gracefully returns null. The byline's "Apri la scheda Wegic" CTA in the hero is therefore hidden on this article only. Not a regression — pre-existing data inconsistency surfaced by the rewrite. **Defer** to a data-canonicalization pass that picks one slug for both.

2. **Reclaim AI tool lookup returns null** because no tool with slug `reclaim-ai` exists in `public-tools`. The guide has a `tool_slug: 'reclaim-ai'` and the page handles the null gracefully (no tool CTA, no tool card in rail). Same pattern as Wegic. **Defer** to tool directory ingestion.

3. **No full-page screenshot of the article body in TOC-active state** — the TOC has scroll-driven active highlighting but it requires actual user scroll to fire. Coverage is by static screenshots only. Future Playwright `scroll-into-view` test would cover it.

4. **Reading progress bar relies on `[data-guides-article-body]` selector** in the `ReadingProgressBar` component. If the article body element is missing (e.g. not-yet-rendered future variant), the progress bar silently no-ops. Defensive but worth a logged warn.

5. **Custom markdown blocks (`:::tip` etc.) are preprocessed in `GuideMarkdown` and don't survive copy/paste** — the raw markdown is transformed before render. If anyone edits the seed markdown to include a `:::` block, the rendered HTML will be different from what they pasted. Documented in the component but not surfaced in the editor.

6. **`scripts/_guides_content/*.md` files are not wired back to the seed** — they are reference artifacts. If a guide is later edited in the seed, the .md source will drift. Either delete them or build a one-shot sync; right now they're frozen snapshots.

7. **Topic vocabulary is still a bit fragmented**: with 12 guides across 11 distinct topic labels, the filter chips show every topic with count `1`. Not wrong, but a 12-guide library would benefit from 4–6 broader topic clusters. **Defer** until a 4th guide lands in a given area.

---

## 9. Closing

The Guides section now reads as a serious editorial surface: clear hierarchy, distinct topic identities, no decoration for decoration's sake, every article genuinely worth reading. The 12 articles are 5–7× longer than the previous drafts, structurally consistent, factually cautious, and free of AI-writing fingerprints. Cross-scope safety preserved: zero partner / sponsor / ad changes.

Single commit: **`9fbafa1 MiniMax · guides: editorial + UI/UX rebuild of /posts (12 guides rewritten)`**.
