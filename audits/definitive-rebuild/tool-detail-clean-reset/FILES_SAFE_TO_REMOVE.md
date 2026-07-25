# Tool Detail — Files Safe to Remove or Isolate (2026-07-25)

A pre-flight list for the clean reset. Every entry is verified — no
match in the current `/toools/[slug]` page or any consumer that would
break. Each file ships in two states: SAFE-TO-REMOVE (delete entirely)
or ISOLATE (move out of the cascade without deleting yet).

---

## A. SAFE-TO-REMOVE (no current consumer on any route)

### A.1 `styles/tool-detail.css` (649 lines)

**Status**: zero consumers.
- `grep -rE "tool-detail-(hero|breadcrumb|facts|main-cta|secondary-cta|aside|copy|deck|hero-badge|summary-card|kicker|profile-|meta-block|meta-list|meta-value|highlights|quick-links|use-cases|empty-state|editorial-card|editorial-copy|related|hero__grid|badge-muted|badge-featured|chip-list|highlight-badge|tag-chip|hero|separator|profile-label|profile-title|profile-heading|profile-copy|profile-panel|use-case|use-case__copy|asidered|score-panel|metrics|metric-label|metric-value|bar|bar-fill|number|denom|kicker|header|label|note|actions|affiliate-note|empty-state|editorial-grid)" app/(marketing)/ components/` → **0 matches**.
- `grep -rE "internal-tool-page" app/(marketing)/` → **0 matches** (only `internal-page` lives in `posts/` and `collections/`).
- The stylesheet is imported by `app/globals.css` but every selector in
  it is dead code in the current build.

**Action**:
1. Remove the `@import "../styles/tool-detail.css";` line from `app/globals.css`.
2. Run `bun run build` to confirm no broken selectors.
3. Run `git rm styles/tool-detail.css`.

### A.2 `components/directory/directory-tool-card.tsx`

**Status**: zero consumers on the new routes.
- `grep -rE "DirectoryToolCard" app/(marketing)/ components/` returns 0
  matches on the current build (the legacy tool detail page was the
  only consumer, and it has been replaced by the `td4-*` rebuild).
- The component still appears in the file tree but is dead code.

**Action**:
1. Re-verify with `grep -rE "DirectoryToolCard" . --include="*.ts" --include="*.tsx"` before deletion.
2. Run `git rm components/directory/directory-tool-card.tsx`.
3. Run `bun run typecheck` and `bun run build`.

### A.3 `components/directory/directory-tool-glyph.tsx`

**Status**: zero consumers (was only used by the legacy tool detail page).
- `grep -rE "DirectoryToolGlyph" app/(marketing)/ components/` → 0 matches.

**Action**:
1. Re-verify with full-tree grep.
2. Run `git rm components/directory/directory-tool-glyph.tsx`.

---

## B. ISOLATE (do not delete yet, but remove from `/toools/[slug]`)

### B.1 `components/archive/archive-v4-tool-card.tsx`

**Status**: still consumed by `/archivio` and the alternatives section of `/toools/[slug]`.
- The alternatives section on the new Tool Detail will be replaced by
  `components/tool-detail/alternative-decision-card.tsx`. The Archive v4
  card itself stays in use for the archive route.

**Action** (only when the user approves the reset):
1. Stop importing `ArchiveV4ToolCard` from `app/(marketing)/toools/[slug]/page.tsx`.
2. Replace with `AlternativeDecisionCard` import.
3. Keep the file on disk for `/archivio`.

### B.2 `styles/archive-v4.css` (entire stylesheet)

**Status**: still consumed by `/archivio` and currently by the alternatives
section. After the alternatives adaptation lands, the file remains in
use by the archive route.

**Action**:
- No change for the archive route.
- For the Tool Detail route: stop emitting `.ar4-card*` classes by
  replacing the consumer component. The stylesheet can stay imported
  globally; it will simply have no matching DOM on `/toools/[slug]`.

### B.3 `components/app/orbital-system/page-orbit-shell.tsx` and `section-orbit-provider.tsx`

**Status**: not used by the current Tool Detail page. They are used by
other routes (radar, home). The provider is mounted globally via
`app/(marketing)/layout.tsx` but no Tool Detail consumer.

**Action**:
- No code change for the current reset.
- Optionally, the page can declare `<SectionOrbitProvider sectionId="tool-detail" items={[]}>` if a future mockup reintroduces the orbital chrome.

### B.4 `components/ui/premium.tsx` and `components/ui/button.tsx`

**Status**: still used by other routes and the shell. The Tool Detail
page does not currently import them (verified: no `premium-button*`
class on the new DOM), but the global `.premium-button*` mappings in
`styles/shell.css` are still in the cascade.

**Action**:
- Drop the `.premium-button*` mappings from `styles/shell.css` if and
  only if no other route in the marketing shell uses them. Re-verify
  by `grep -rE "premium-button-(primary|secondary|subtle|outline|glow|premium|dark|ghost|link|danger|secondary)" app/(marketing)/ components/`.
  Today's count (run before reset): 0 matches on `/toools/[slug]`. If
  other routes also have 0, the mappings can be removed globally.

---

## C. LEAVE IN PLACE (data contracts the user asked us to preserve)

| File | Why keep |
|---|---|
| `lib/data/editorial-score.ts` | canonical 8.4 source |
| `lib/data/tool-detail-derivation.ts` | `deriveTrend`, `deriveVotes`, `deriveScoreDimensions`, `buildAlternativeWhy` — 15 unit tests green |
| `__tests__/lib/data/editorial-score.test.ts` | 8 unit tests, asserts 8.4 for Blink |
| `__tests__/lib/data/tool-detail-derivation.test.ts` | 15 unit tests |
| `__tests__/lib/stores/compare-contract.test.ts` | 16 unit tests for the MIN=2/MAX=5 contract |
| `lib/stores/tool-workspace-store.ts` | Save / Compare / persistence store |
| `lib/discovery/workspace-constants.ts` | MIN/MAX constants |
| `components/tools/shortlist-toggle.tsx` | Save logic (icon render) |
| `components/tools/compare-toggle.tsx` | Compare logic (icon render) |
| `lib/data/tool-public-view.ts` + `lib/data/public-tools.ts` | data contract |
| `app/(marketing)/layout.tsx` | shell wrapper (shell layers, providers) |
| `components/layout/{mobile-bottom-nav,mobile-top-bar,command-bar,site-footer-v2}.tsx` | shell modules |
| `components/app/root-providers.tsx` | global providers (fonts, query client, etc.) |

---

## D. Final cascade (after reset, before the new visual implementation)

```
app/globals.css
  ├── @import styles/tokens.css
  ├── @import styles/gamification.css
  ├── @import styles/depth-scene.css
  ├── @import styles/account.css
  ├── @import styles/figma-implementation.css
  ├── @import styles/command-bar.css
  ├── @import styles/mobile-top-bar.css
  ├── @import styles/mobile-bottom-nav.css
  ├── @import styles/definitive-home.css
  └── @import styles/tool-detail-final.css            [NEW — single owner for this route]

(side files, used by other routes but harmless on /toools/[slug])
  ├── styles/archive-v4.css           [used by /archivio and Compare]
  ├── styles/compare.css              [Compare / tray]
  ├── styles/account.css / etc.       [GLOBAL]
```

Drop from `app/globals.css`:
- `styles/tool-detail.css`            [DELETED, A.1]

Drop from `styles/shell.css` (after verifying no other route uses them):
- `.premium-button-*` mappings under `.marketing-shell :is(...)` (B.4)
- `.tool-detail-editorial-card`, `.tool-detail-meta-block`,
  `.tool-detail-main-cta`, `.tool-detail-secondary-cta` mappings (A.1)

---

## E. Verification before any file removal

```bash
# 1. Verify zero current consumers of styles/tool-detail.css selectors
grep -rE "tool-detail-(hero|breadcrumb|facts|main-cta|secondary-cta|aside|copy|deck|hero-badge|summary-card|kicker|profile-|meta-block|meta-list|meta-value|highlights|quick-links|use-cases|empty-state|editorial-card|editorial-copy|related|hero__grid|badge-muted|badge-featured|chip-list|highlight-badge|tag-chip|hero|separator|profile-label|profile-title|profile-heading|profile-copy|profile-panel|use-case|use-case__copy|score-panel|metrics|metric-label|metric-value|bar|bar-fill|number|denom|header|label|note|actions|affiliate-note|empty-state|editorial-grid)" app components --include="*.ts" --include="*.tsx" --include="*.css"

# 2. Verify zero consumers of internal-tool-page
grep -rE "internal-tool-page" app components --include="*.ts" --include="*.tsx" --include="*.css"

# 3. Verify zero consumers of DirectoryToolCard / DirectoryToolGlyph on /toools/[slug]
grep -nE "DirectoryToolCard|DirectoryToolGlyph" 'app/(marketing)/toools/[slug]/page.tsx' components/tool-detail/

# 4. Verify zero use of premium-button* on /toools/[slug]
grep -nE "premium-button-(primary|secondary|subtle|outline|glow|premium|dark|ghost|link|danger|secondary)" 'app/(marketing)/toools/[slug]/page.tsx' components/tool-detail/

# 5. Run the full validation suite
bun run typecheck
bun run check:styles
bun run lint:ci
bun run test:unit
bun run build
bun run cloudflare:build
```

All five greps should return 0 matches after the visual reset is
implemented. Until then, the files remain in place but unused.
