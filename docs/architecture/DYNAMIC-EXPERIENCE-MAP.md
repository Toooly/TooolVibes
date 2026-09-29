# Dynamic Experience Map

## Entity Sources

| Entity | Source File | Routes Using |
|---|---|---|
| Tool | `lib/data/tooolvibes-directory.ts` | /toools/*, /archivio, /compare, /shortlist, /radar |
| ToolPublicView | `lib/data/tool-public-view.ts` | /toools/* (canonical view model) |
| Related Tools | `lib/data/public-tools.ts` | /toools/* (alternatives) |
| Guides | `lib/data/public-articles.ts` | /posts/* |
| Guide Relations | `lib/data/guide-related.ts` | /posts/* (related) |
| Collections/Stacks | `lib/data/public-collections.ts` | /collections/* |
| Compare State | `lib/stores/tool-workspace-store.ts` | /compare, dock |
| Saved State | `lib/stores/tool-workspace-store.ts` | /shortlist |
| Decisions | `lib/stores/tool-workspace-store.ts` | /account |
| Sponsor | `components/monetization/partner-placements.tsx` | contextual |
| Affiliate | `lib/types/affiliate-link.ts` | outbound CTAs |

## Duplicated Data

- Motion tokens: `--motion-*` in tool-detail-final.css duplicates `--tv-duration-*` in tokens.css
- Tool display data: resolved from `ToolPublicView` (canonical) — no duplication found
- Alternative data: resolved from `getRelatedToolViewsBySlug` (canonical) — no duplication found

## Hardcoded Relationships

- None found in tool-detail-final components (no slug-specific markup)

## Missing Canonical Relations

- Guide → Tool bidirectional links (guide-related.ts exists but Tool page doesn't expose related Guides)
- Category → Guide links (not implemented)
- Stack → Tool bidirectional links (workspace store has stacks but Tool page doesn't expose related Stacks)
