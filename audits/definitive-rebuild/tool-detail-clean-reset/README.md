# Tool Detail — Clean Reset Audit (2026-07-25)

**Status**: TOOL DETAIL CLEAN RECONSTRUCTION — WAITING FOR DEFINITIVE MOCKUPS.

The visual work is paused. This folder is the audit inventory that
drives the next implementation pass.

## Files in this folder

| File | Purpose |
|---|---|
| `LEGACY_LAYER_MAP.md` | Per-section inventory of every React owner, CSS file, class namespace, generation label, fixed/sticky surface and z-index affecting `/toools/[slug]`. |
| `DOM_OWNERSHIP_GRAPH.md` | DOM tree (element → owner → stylesheet → gen) and the CSS cascade graph. Includes the duplicate-selector / scope-leak audit. |
| `PROPOSED_CLEAN_TREE.md` | New owner tree (`ToolDetailFinalPage` + 7 section components + `AlternativeDecisionCard`), single namespace `.td-final-*`, reuse / forbidden reuse matrix, file-by-file reset plan. |
| `FIXED_SURFACE_CONTRACT.md` | Canonical stacking contract: z-index tokens, per-layer contract, single owner per surface, scroll-padding, reduced-motion, public CSS custom properties. |
| `FILES_SAFE_TO_REMOVE.md` | List of dead files (delete) and isolated files (decouple) with verification greps and the target cascade. |

## What the user said

> STOP.
> Do not proceed to Full Radar.
> Tool Detail V4 is NOT visually accepted.
> Do not perform another cosmetic polish pass.
> Create a legacy-layer inventory.
> Build a DOM and CSS ownership graph.
> Define a clean rebuild boundary with `ToolDetailDefinitive` and `.td-final-*`.
> Remove, do not override.
> Establish a fixed-surface governance.
> Wait for five binding mockups.
> Do not implement the next visual version.

## What is preserved

Per user instruction, the following functional work is **not** in the reset:

- canonical Blink score 8.4 (`lib/data/editorial-score.ts`)
- Save store (`useToolWorkspaceStore`)
- Compare `MIN_COMPARE_TOOLS = 2`, `MAX_COMPARE_TOOLS = 5`
- persisted state
- external CTA behavior
- real tool data
- SEO + structured data
- test coverage on derivations, scores, compare contract (39 green)
- factual unavailable states (no fabricated PH data)

The clean reset applies to **visual architecture** only.

## What the reset will do (after the user signs off)

1. Delete `styles/tool-detail.css` (649 lines of dead V1 code).
2. Delete legacy `DirectoryToolCard` and `DirectoryToolGlyph` if no other route uses them.
3. Drop the legacy `.tool-detail-*` and `.premium-button*` mappings from `styles/shell.css`.
4. Replace `ArchiveV4ToolCard` in the alternatives section with a new `components/tool-detail/alternative-decision-card.tsx` that owns its own ivory-surface anatomy.
5. Rename the new namespace from `.td4-*` to `.td-final-*` and split the page into 7 section components under `components/tool-detail/`.
6. Apply the fixed-surface stacking contract (`FIXED_SURFACE_CONTRACT.md`).
7. Add Playwright tests for stacking / responsive nav / scroll-padding.

## What the reset will NOT do

- Touch the data layer (`editorial-score.ts`, `tool-detail-derivation.ts`).
- Touch the workspace store or the compare contract.
- Touch the shell layers (`MobileBottomNav`, `MobileTopBar`, `CommandBar`, `SiteFooterV2`).
- Touch the providers (`AccountProvider`, `DiscoveryPersistenceProvider`, `OrbitalProvider`, `GamificationShell`).
- Touch SEO / structured data / static generation.
- Touch any route other than `/toools/[slug]`.

## Next step

The visual implementation is **paused** until the user supplies the five
binding mockups:

1. Tool Detail desktop 1440
2. Tool Detail mobile 390
3. Tool Detail tablet 768 / 1024
4. Alternatives Decision Desk
5. Interaction and fixed-surface system

When the mockups arrive, the structural reset above can begin in parallel,
and the visual pass will be a one-shot per section.

---

**TOOL DETAIL CLEAN RECONSTRUCTION — WAITING FOR DEFINITIVE MOCKUPS.**
