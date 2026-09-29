# Section Registry

## Concept

`buildToolDetailSections()` creates a canonical section registry before rendering.
The same registry drives: section rendering, sticky nav, anchors, scrollspy, analytics.

## Registry Type

```typescript
type ToolDetailSection = {
  id: string;
  label: string;
  enabled: boolean;
  navVisible: boolean;
  analyticsKey: string;
};
```

## Input

```typescript
type ToolDetailSectionInput = {
  hasExtendedContent: boolean;
  hasRelatedTools: boolean;
  hasRelatedGuides: boolean;
  hasRelatedStacks: boolean;
  hasTechnicalData: boolean;
  hasPricing: boolean;
};
```

## Sections

| Section | Nav Visible | Condition |
|---|---|---|
| Panoramica | ✅ | always |
| Approfondisci | ✅ | hasExtendedContent |
| Prezzi | ✅ | hasPricing |
| Alternative | ✅ | hasRelatedTools |
| Guide correlate | ❌ | hasRelatedGuides |
| In questi Stack | ❌ | hasRelatedStacks |
| Dati tecnici | ❌ | hasTechnicalData |

## No DOM-derived semantics

The nav receives `navSections` as props. DOM is used only for geometry/IntersectionObserver.
