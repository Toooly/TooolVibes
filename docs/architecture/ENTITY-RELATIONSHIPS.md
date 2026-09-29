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

## Bidirectional Resolvers (lib/graph/entity-relations.ts)

- `getGuidesForTool(toolSlug, guideData)` → ToolRelation[]
- `getToolsForGuide(guideContent, tools)` → ToolRelation[]
- `getCategoriesForTool(tool)` → string[]
- `getToolsForCategory(category, tools)` → ToolRelation[]
- `getGuidesForCategory(category, guideData)` → GuideRelation[]
- `getStacksForTool(toolSlug, stacks)` → StackRelation[]
- `getToolsForStack(stack, tools)` → ToolRelation[]
- `getRelatedTools(current, allTools, limit)` → ToolRelation[] (deterministic scoring)
- `getRelatedGuides(toolSlug, guideData, limit)` → GuideRelation[] (deterministic scoring)

## Scoring (deterministic)

Related Tools: category match +3, shared segments +2 each, shared tags +1 each.
Related Guides: direct tool reference +3, word overlap +1 per word. Minimum score 3.
