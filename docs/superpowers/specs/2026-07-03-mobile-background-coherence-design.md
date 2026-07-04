# Mobile Background Coherence — Design Spec

## Goal
Eliminate the “patchwork” effect on TooolVibes mobile section backgrounds. Every mobile section should feel like a single, premium, intentional scene from top to bottom, while preserving the spatial/game/editorial identity.

## Scope
- **Mobile only**: changes are isolated to `@media (max-width: 767px)` or `.mobile-*` classes.
- **No desktop changes**, no backend/login/Supabase/API/routing changes.
- Sections explicitly in scope: Radar, Tool Battle / Battaglie Tool, Categories (reference).
- All other mobile marketing sections are reviewed and fixed where background breaks are found.

## Design decisions

### 1. Unified dark foundation
- All dark mobile sections use the same base background: `#06060E` (`--v-void`).
- Vertical gradient “strips” inside a single section (e.g. Collections `#0a0412 → #14082a → #0f0618`) are replaced by a solid dark base plus a very subtle shared radial accent.
- Section identity is conveyed through content, accents, and lightweight thematic decorations — not through different base colors.

### 2. Categories remains the light exception
- The Categories section keeps its light `var(--gradient-shell)` background as requested.
- It is treated as a deliberate atmospheric shift, not a mistake.
- Transitions into/out of Categories are checked for hard bands or empty gaps.

### 3. Decorations are reduced, not removed
- Thematic decorations (stars, radar sweep, glows) stay, but are reduced in intensity and made coherent with the dark base.
- No new heavy effects; no animated blur/backdrop-filter additions.

### 4. Mobile-only CSS variables
A new block inside the mobile breakpoint defines shared tokens:

```css
:root {
  --mobile-bg-void: #06060E;
  --mobile-bg-section: #06060E;
  --mobile-bg-section-soft: radial-gradient(circle at 50% 0%, rgba(106, 60, 255, 0.03), transparent 50%);
  --mobile-bg-card: rgba(255, 255, 255, 0.05);
  --mobile-border-subtle: rgba(255, 255, 255, 0.08);
}
```

These are applied to section roots and card surfaces, replacing ad-hoc gradients and `!important` overrides.

## Per-section treatment

### Radar (`/radar`)
- Root background changed from `#0a0a1a` to `--mobile-bg-section`.
- Radar canvas keeps its internal gradient, but the surrounding page no longer creates a color seam.
- Header/sheet panels use `--mobile-bg-card` with `--mobile-border-subtle` instead of mismatched translucent darks.
- Node halos and scan-hit glows are reduced in intensity.

### Tool Battle / Shortlist / Compare (`/shortlist`, `/compare`)
- Remove the competing light/dark CSS definitions and the `!important` dark override.
- Apply `--mobile-bg-section` to the board root and `--mobile-bg-card` to cards.
- Clean up legacy `.mobile-shortlist-board` vs `.mobile-library-board` rules: keep only the class actually rendered by the component.
- Empty state uses the same background tokens, not a separate gradient.

### Collections (`/collections`)
- Replace the broken vertical gradient with `--mobile-bg-section`.
- Hero glow is kept but reduced and no longer clipped abruptly.
- Per-item card gradients are toned down or replaced with `--mobile-bg-card` plus a thin accent border.

### Metodo (`/metodo`)
- Same background unification as Collections.
- Starfield layer remains but is sparser and lower in opacity.
- Step panels use `--mobile-bg-card` and `--mobile-border-subtle`.

### Home / Hero (`/`)
- Keep `--v-void` base; ensure the switch from animated orbit (desktop) to static grid (mobile) does not introduce a visible band.
- Reduce per-node colored glow intensity in the static grid.

### Categories (`/archivio`)
- Keep light shell background.
- Verify sticky header glass does not create banding; reduce blur strength if necessary.
- Ensure the colored category blobs do not look like disconnected patches against the light shell (reduce shadow/glow spread).

## File impact
- `app/globals.css` — new mobile tokens, section background overrides, cleanup of conflicting Shortlist rules.
- `styles/radar.css` — radar-specific mobile background/coherence fixes.
- `styles/vibes-3d-maestoso.css` — home/hero mobile background continuity fixes.
- Component files may need tiny JSX changes only if a background is hard-coded inline (to be confirmed during implementation planning).

## Acceptance criteria
- Every dark mobile section reads as one continuous scene from top to bottom.
- Radar has no bands, seams, or abrupt color changes.
- Tool Battle has a single coherent visual direction.
- Categories remains light but is not jarring.
- Text and cards remain highly readable.
- No desktop impact.
- Build/lint/test pass.

## Risks and mitigations
| Risk | Mitigation |
|------|------------|
| Shared CSS classes affect desktop | All changes wrapped in mobile breakpoint or `.mobile-*` selectors. |
| Removing `!important` exposes old light rules | Audit all selectors; delete unused conflicting rules rather than overriding. |
| Canvas radar gradient looks different from page | Adjust canvas gradient stops to blend with `#06060E`. |
| Categories light section feels disconnected | Add subtle vertical spacing and ensure adjacent sections end/start cleanly. |
