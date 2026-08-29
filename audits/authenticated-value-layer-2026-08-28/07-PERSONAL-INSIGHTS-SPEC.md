# 07 — Personal Insights Spec

**Status:** Wave F IMPLEMENTED / ACCEPTED (not RELEASED). Radar personalization TARGET Wave G.  
**CURRENT:** editorial `/10` scores; compare objective-fit ranking; Home/Salvati resurface heuristics remain. Wave F adds `lib/account/personal-insights.ts` (`derivePersonalInsights`) on Tool Page + one Compare line. `recommendWorkspaceTools()` stays unused and is not the product. RECENT_SIGNAL inactive (Wave G). No relationship-aware Radar.

---

## Law

No generic AI score. No “87/100 recommended”. No LLM in V1. Every insight is explainable and has a `source`.

Separate:

| Kind | Who | Example |
|---|---|---|
| PUBLIC INSIGHT | anyone | “Descript combines transcript editing, audio and video editing.” (editorial) |
| PERSONAL INSIGHT | logged-in, derived from workspace | “Usi già Riverside nello Stack Podcast, quindi Descript si sovrappone a parte del flusso.” |

The second **requires** login (`insight.personal`).

---

## Object (V1)

```ts
type PersonalInsightType =
  | "FIT"
  | "WHY_NOT"
  | "OVERLAP"
  | "ALREADY_KNOW"
  | "STACK_FIT"
  | "REPLACEMENT"
  | "DECISION_CONTEXT"
  | "RECENT_SIGNAL";

type PersonalInsight = {
  type: PersonalInsightType;
  toolSlug: string;
  title: string;
  explanation: string; // Italian, deterministic template
  source: InsightSource;
  action?: { label: string; href: string };
};

type InsightSource =
  | { kind: "workspace"; fields: string[] }
  | { kind: "catalog"; fields: string[] }
  | { kind: "radar"; id: string }
  | { kind: "editorial"; id: string };
```

No `confidence` number in V1 (optional field reserved, unused). Do not display scores.

---

## Deterministic derivation (candidates)

Reuse / extend `recommendWorkspaceTools` reasons (`open_compare_category`, `fits_stack`, `alternative_to_saved`, `declared_focus`, `declared_goal`) but **do not ship focus/goal as V1 UI** if Signal profile remains flag-off. V1 insights must work from V1 + public catalog alone.

| type | Trigger (all must be true) | Template sketch | source |
|---|---|---|---|
| FIT | open compare includes same category; slug not in compare; not rejected | “Perché stai confrontando {category}” | workspace compare + catalog category |
| WHY_NOT | outcome rejected **or** overlap with a tool `usage=using` in same category | “L’hai scartato il {date}” / “Si sovrappone a {name} che usi” | decision / usage |
| OVERLAP | another saved/using tool shares categoryLabel (or editorial alternative link if present) | “Si sovrappone a {names} nel tuo spazio” | catalog category + saved/using |
| ALREADY_KNOW | slug already saved or previously decided | “È già nei Salvati” / “L’hai già valutato ({outcome})” | saved / decision |
| STACK_FIT | active stack name/description contains category token | “Si adatta allo stack {stack.name}” | personalStacks + catalog |
| REPLACEMENT | using tool in same category, or editorial alternative to a using slug | “Possibile sostituto di {usingName}” | usage + catalog |
| DECISION_CONTEXT | compare tray contains slug with existing decision/note | “Hai scritto: {note excerpt}” / “Decisione: {outcome}” | toolStates |
| RECENT_SIGNAL | Filo event on slug in last 30d | “Ultimo evento: {humanizeFiloEvent}” | events[] |

Cap: **max 3 insights per tool surface**, **max 2 per compare column**. Prefer WHY_NOT / OVERLAP / STACK_FIT over FIT spam.

Never invent “goodness”. If no rule matches, show **nothing** (no empty score).

---

## Surfaces (TARGET)

| Surface | CURRENT | TARGET |
|---|---|---|
| Tool page | editorial only | personal layer below public identity — progressive enhancement of the **same route** |
| Compare | editorial + objective-fit | Deep Compare consumes the same objects (Wave E can show a subset; Wave F fills types) |
| Salvati rows | relationship chips | **do not clutter rows** — insights on demand (⋯ or tool page). No Home 2.1. |
| Home | resume heuristics | **do not redesign Home** to be an insights feed |
| Radar | public PH | Wave G signals (below) |

Guest hitting a “personal insight” teaser: AuthSheet `insight.personal`, continuation `{ slug }`.

---

## Performance

Derive from the **same workspace index** as search (Wave D). Lazy: compute on tool page / compare mount for visible slugs only. Never N+1. Never server LLM. Never scan catalog × workspace on every keystroke.

---

## Relationship-aware Radar (Wave G, not F)

**CURRENT:** public Radar = what is new/trending (Product Hunt). Auth sees the same.

**TARGET `radar.personal`:** public lens remains; authenticated adds explainable chips on items:

| Signal | Rule | Copy sketch |
|---|---|---|
| alternative to using | radar slug same category as a `usage=using` tool | “Alternativa a {name} che usi” |
| similar to saved | same category as saved, not rejected | “Vicino a qualcosa che hai salvato” |
| fits a stack | stack name/category token match | “Potrebbe entrare in {stack}” |
| already evaluated | decision present | “Già valutato ({outcome})” |
| already rejected | outcome rejected | “L’avevi scartato” |
| replacement candidate | same as REPLACEMENT insight | “Sostituto possibile” |
| review-worthy | slug saved and reviewDue | “Da rivedere nel tuo spazio” |

No fake personalization. If no join, show the public card only.

Do not add save/compare to Radar in this workstream unless it already exists (CURRENT: radar components do not save). DEFERRED: Radar save/compare.

---

## FUTURE

AI prose explanations, catalog-diff insights, Signal focus/goal when that product is on. Not V1.

---

## Forbidden

Fake scores. LLM per page. Home insights hero. Shipping `recommendWorkspaceTools` unchanged as if it were the product.
