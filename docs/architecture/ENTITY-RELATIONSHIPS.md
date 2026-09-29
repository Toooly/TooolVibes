# Entity Relationships

## Canonical Entities

- **Tool**: id, slug, name, logo, category, score, pricing, alternatives
- **Category**: derived from tool.category/taxonomy
- **Guide**: article with topic relations
- **Stack**: user workspace collection
- **Decision**: user workspace decision record
- **Pricing**: tool.pricingStatus, tool.pricingPlans
- **AlternativeRelation**: resolved via getRelatedToolViewsBySlug (category + relevance)
- **Affiliate**: tool.affiliateUrl (separate from pricingSourceUrl)
- **Sponsor**: partner-placements (contextual)

## Resolution

All surfaces resolve from `ToolPublicView` — one canonical view model.
Logo: `tool.logoUrl` → letter fallback (no route-specific mappings).
Alternatives: `getRelatedToolViewsBySlug` (deterministic, not random).
