# Tool Page Engine

## Architecture

One `ToolDetailFinalPage` component renders ALL tools. No slug-specific markup.

## Section Model

Sections derive from canonical data:
1. **Hero** (always) — identity, score, actions
2. **Section Nav** (always) — derives from rendered sections
3. **In Sintesi** (always) — decision brief
4. **Approfondisci** (if extendedContent) — accordion panels
5. **Pricing** (always) — verified plans or fallback
6. **Alternatives** (if relatedTools.length > 0) — carousel
7. **Technical Data** (if hasToolDetailInformation) — standalone section
8. **Sponsor** (contextual) — compact variant

## Dynamic Section Nav

Nav items derive from actual rendered section IDs. No hardcoded IDs.

## Related Content

- `getRelatedToolViewsBySlug(slug, 3)` — deterministic relevance
- Future: related Guides, related Stacks (bidirectional)

## Logo Resolution

`tool.logoUrl` → letter fallback. Single shared resolver.

## Section Registry Integration

`buildToolDetailSections()` is called before render. `getNavSections()` returns nav-visible sections.
Nav component receives `navSections` as props — no DOM query.
