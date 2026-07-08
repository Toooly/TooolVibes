# TOOOLVIBES — Product & Design Context

> **Read this once before any audit.** All UI recommendations must be made in the context defined here. If the audit uncovers a fact that contradicts this doc, the audit wins, and this doc gets updated.

---

## 1. What Tooolvibes is (one paragraph)

Tooolvibes is a **curated AI tools and digital tools discovery platform**. Unlike a static directory, it helps users **discover, evaluate, shortlist, compare, remember, and choose** software for AI, growth, product building, and digital strategy. It blends editorial curation, decision-support surfaces (compare / shortlist), persistent memory (saved tools + notes), digital shop / product offers, a community / content layer, and a positioned service offering.

**Tagline slot** (recommend — confirm in product copy): *"Tools, curated for builders."*

---

## 2. Target audience (in order of priority)

1. **Indie / solo builders** (founders, designers-engineers, technical PMs) evaluating AI tools weekly.
2. **Small product teams** (3–15 people) standardizing on a stack and documenting decisions.
3. **Growth & marketing operators** looking for vetted tools across SEO, automation, analytics, creative.
4. **Agencies and consultants** doing vendor research and client recommendations.
5. **Service providers** (writers of editorial content, affiliates, integration partners).

Secondary: enterprise scouts using Tooolvibes as a curated feed before deeper vendor research.

---

## 3. Product areas (surfaces)

| Area                    | Purpose                                                                   | Primary screens                                                                                              |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Discovery**           | Browse / search the catalog.                                              | Home, category hubs, search, filters, tag pages.                                                             |
| **Tool Detail**         | Read the curated profile of a single tool.                                | `/tools/[slug]`.                                                                                             |
| **Shortlist**           | Personal list of saved tools with notes.                                  | `/shortlist`, inline save control on cards.                                                                  |
| **Compare**             | Side-by-side view of 2–4 tools on curated dimensions.                     | `/compare` (sticky slug params).                                                                             |
| **Editorial**           | Long-form content (reviews, roundups, opinion).                           | `/editorial`, `/editorial/[slug]`.                                                                           |
| **Categories / Tags**   | Browse by curated taxonomy.                                               | `/category/[slug]`, `/tag/[slug]`.                                                                           |
| **Shop / Offers**       | Optional digital products (templates, kits, mini-courses) and affiliate CTAs. | `/shop`, banner / inline offers inside editorial & detail pages.                                        |
| **Service**             | Positioning of "Tooolvibes can help you choose" / advisory offering.      | `/services`, contact CTA.                                                                                    |
| **Account**             | Saved tools, notes, comparison history, profile.                          | `/account/*`.                                                                                                |
| **Onboarding**          | First-run primer for new users.                                           | Empty states + first interaction flows (no marketing popups).                                                |
| **Auth**                | Email + OAuth login.                                                      | `/login`, `/signup`.                                                                                         |
| **System**              | 404, 500, offline, maintenance.                                           | `not-found.tsx`, `error.tsx`, etc.                                                                           |

---

## 4. Brand feel — what it must feel like

### Must feel
- **Curation over catalog.** Every screen reads as if a human edited it.
- **Calm authority.** Sober, technical, restrained. Like Linear / Arc / Vercel, not ProductHunt.
- **Editorial gravity.** Typography carries weight; whitespace carries meaning.
- **Decision-support.** The UI helps users *commit*, not just browse.
- **Trustworthy.** Reviewer bylines, last-reviewed dates, citations are first-class.
- **Modern, but not trendy.** Avoid hype fonts, neon, gradient gimmicks, "AI sparkle" clichés.

### Must NOT feel
- A generic affiliate directory.
- A 2010s "Top 10 Tools" blog.
- A SaaS landing page with bouncy CTAs.
- A Web3 NFT gallery or AI-generated slop aesthetic.
- A cluttered SEO pillar page.

### Visual mood anchors (suggested references)
- Linear, Arc, Vercel, Notion, Pitch, Things 3, Stripe Press.
- For editorial: The Verge explainers, Stratechery, FT Lex column.

---

## 5. UI principles (binding)

1. **Identity is monotone + one accent.** Default to a near-black background for surfaces and bright-paper text, or a clean white-paper with deep ink for serif accents. One accent color (default suggestion: electric violet `#7C5CFF` or lime-cyan `#A4FF55` — confirm with brand) for CTAs and active states. No rainbow.
2. **Type does the work.** Hierarchy via weight (300/400/500/600), size, line-height, and tracking — not via color.
3. **One radius language.** Pick `sm: 6 / md: 10 / lg: 16 / pill: 999`. Never mix 8 and 9 in the same surface.
4. **One elevation language.** Use 2–3 named shadows. Avoid stacking multiple borders + shadows.
5. **Curation density.** Cards carry 4–6 elements max. Anything more: open the detail page.
6. **Editorial rhythm.** Mix dense list areas (discovery) with breathing editorial layouts. Density contrast is intentional.
7. **Mobile = research, desktop = decide.** Mobile is read-and-save; desktop is where compare and detail work happens.
8. **Trust signals are first-class.** "Last reviewed", reviewer, citations, saved count, rating distribution.
9. **Speed is a feature.** Skeletons, optimistic UI, image lazy-loading, code-split routes.
10. **No dark patterns.** No deceptive CTAs, no fake urgency ("3 people viewing"), no fake social proof.

---

## 6. Current situation (CSS-first, no system)

The Tooolvibes UI today was shaped by **iterative CSS work, not by a Figma-first system**. This creates specific risks the agent must address:

- **No central tokens.** Colors, spacing, radii, type may be inconsistent across files.
- **No shared components.** Buttons, cards, badges may be duplicated with subtle variations.
- **No Figma source-of-truth.** Visual decisions exist only in CSS, making them fragile under refactor and impossible to delegate to design hires / agencies.
- **Implicit design language.** Spacing rhythm and type scale may be implicit (eyeballed) instead of declared.
- **Refactor risk.** Without a system, every "small improvement" requires editor-level memory of every screen.

The agent's mission is to **introduce order without rewriting** the working app — establish tokens, surface a component library, classify everything into Figma-SoT / Figma-Reference / Code-Only.

---

## 7. Desired Figma ↔ code workflow

Target workflow once this agent has done its job:

```
   ┌─────────────────────┐
   │       Figma         │
   │  (source of truth   │   ← designs originate here
   │   for tokens, core  │
   │   components, key   │
   │   pages)            │
   └──────────┬──────────┘
              │ handoff spec (this agent's output)
              ▼
   ┌─────────────────────┐
   │       Code          │
   │  Next.js + tokens + │   ← implements & owns the rest
   │  primitives + comps │
   └──────────┬──────────┘
              │ screenshots, real usage
              ▼
   ┌─────────────────────┐
   │  Figma "Reference"  │   ← light snapshots of what shipped
   │  (visual snapshot)  │      for cross-team review
   └─────────────────────┘
```

- **Figma is consulted** for tokens, primitive components (Button, Badge, Input, Card, Tooltip, Modal), and 5–7 hero pages (Home, Discovery, Tool Detail, Compare, Shortlist, Editorial article, Service).
- **Code is the source of truth** for everything bespoke (landing blocks, niche pages, etc.).
- **Bidirectional drift detection** — at every milestone, check 2–3 hero pages in Figma match code and update the Figma "Reference" snapshot if drift > minor.

---

## 8. Product risks the agent must surface

| Risk                                       | UI signal                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Trust decay**                            | No "last reviewed", missing reviewer name, fake ratings, affiliate CTAs disguised as editorial. |
| **Catalog fatigue**                        | Endless homogenous cards; no editorial anchor; no curatorial voice.                             |
| **Decision paralysis**                     | Compare flow with too many columns; no defaults; no "best for…" guidance.                        |
| **Mobile abandonment**                     | Compare cramped on phone; save hidden behind hover; search unusable on small screens.            |
| **Visual sameness with competitors**       | Looks like every "Top Tools 2026" blog. Loss of identity.                                       |
| **Accessibility exclusion**                | Low contrast on tags, color-only state signaling, tiny tap targets.                              |
| **Slow perceived performance**             | Layout shift on detail page; no skeletons; unoptimized cover images.                            |
| **Brand dilution via dark patterns**       | "Trending" badges with no backing; "X people saved" without data.                                |
| **Editorial collapse**                     | Articles look like blog spam; no author bio; no cite-rhythm; no typography hierarchy.            |
| **Empty shortlist UX death**               | First-time users hit empty compare/shortlist and bounce.                                        |
| **System drift**                           | 17 button styles; 6 radii; inconsistent spacing — the *original* risk this agent exists to fix. |

The agent should treat any of these as **immediate P0/P1 candidates** if encountered.

---

## 9. Stack signal (infer & confirm)

The agent should infer from `package.json` and the repo before suggesting anything. Canonical signals to look for:

- **Framework:** Next.js (App Router likely).
- **Styling:** CSS Modules / Tailwind / styled-components / vanilla CSS. Whichever it is, **respect it** — do not propose a wholesale switch unless the existing stack is broken.
- **State:** local React state / Zustand / Redux / Supabase realtime. Don't propose additions.
- **DB & Auth:** Supabase. **Do not** suggest changes to queries / RLS / auth.
- **Search:** client-side filter, Algolia, Postgres FTS, or Typesense — check before recommending.
- **CMS / Editorial:** MDX? Notion? Sanity? Inspect `/editorial` route.
- **Image pipeline:** `next/image` / Cloudinary / Imgix.

If the stack isn't clear, the agent must ask one targeted question before proceeding.

---

## 10. Open product questions (confirm with the human before locking the design)

1. **Final brand accent color.** Default: electric violet `#7C5CFF`. Confirm.
2. **Light vs. dark default.** Default: dark-first with paper light theme. Confirm.
3. **Type pair.** Default: Inter (UI) + GT Sectra or Fraunces (editorial display). Confirm licensing.
4. **Tool data model.** Is "last reviewed" a date column? Is "rating" admin-set or aggregate? Both?
5. **Affiliate disclosure rule.** Where do affiliate CTAs live and how are they labeled?
6. **Shortlist login wall.** Anonymous shortlist via localStorage? Or login required? Default: anonymous first, sync on login.
7. **Editorial CMS.** Confirm source (MDX, Notion, Sanity).
8. **Service page scope.** Is `/services` purely positioning, or do bookings / checkout happen here?

Locking these answers is a precondition for closing P1 design system decisions.

---

## 11. North-star definition of "done" for UI closure

Tooolvibes UI closure is complete when:

- ✅ Tokens (color, type, space, radius, shadow) live in one place and are referenced everywhere.
- ✅ Buttons, badges, cards, inputs, modals, sheets, and toasts all have ONE canonical variant each.
- ✅ All hero pages (Home, Discovery, Tool Detail, Compare, Shortlist, Editorial article, Service) match a Figma source-of-truth frame within tight tolerance.
- ✅ Mobile (375), tablet (768), desktop (1280), wide (1920) all pass the QA checklists in `CHECKLISTS/`.
- ✅ WCAG 2.2 AA passes on contrast, focus, and target sizes for all surfaces.
- ✅ Trust signals (last reviewed, reviewer, citations) are first-class on every tool page.
- ✅ No P0 / P1 issues remain open.
- ✅ Implementation changes are surgical, audited, and reversible.

When all boxes tick, the agent returns a **final UI closure report** summarizing what shipped and any remaining P2/P3 backlog.

---

## 12. Assumption notes pattern

The 8 questions in §10 are preconditions for closing P1 design decisions. The agent should not block the audit waiting for human answers — instead, **proceed and surface assumptions inline**.

When the agent makes an assumption during an audit (e.g. "the brand accent is violet because the codebase uses `--accent-violet`"), it must:

1. Start the assumption with the literal token `ASSUMPTION:` so a human reviewer can grep for it.
2. Cite the evidence that supports the assumption (file:line, grep, or visual signal).
3. List the assumption once at the top of the audit report under a heading `## Assumptions made (this run)`.
4. Restate it in the Open Questions for the human at the end.

```md
## Assumptions made (this run)

- **ASSUMPTION: brand accent is electric violet `#7C5CFF`.** Evidence: `tailwind.config.ts:23` defines `accent.DEFAULT: '#7C5CFF'`. Confirm or override.
- **ASSUMPTION: anonymous shortlist via localStorage, sync on login.** Evidence: `lib/shortlist.ts:14` reads `window.localStorage` for guests. Confirm.
- **ASSUMPTION: dark-first UI.** Evidence: `app/globals.css:5` sets `body { background: #0A0A0A }`. Confirm light/dark policy.

## Open questions for the human

1. Confirm or override each `ASSUMPTION:` above (questions 1–3 in §10).
2. … add additional questions the audit surfaced …
```

This pattern lets the agent keep moving while leaving a clear trail for the human to confirm or override. Each confirmed assumption becomes a binding design decision; each override triggers a follow-up audit pass.
