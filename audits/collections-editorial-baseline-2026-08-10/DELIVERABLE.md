# TooolVibes — Collections Editorial + Data System Rebuild
**Date**: 2026-08-10
**Operator**: Mavis (Mavis)
**Commit**: `dea7dba MiniMax · collections: deep editorial + data system rebuild (8 collections, V2 model)`
**Scope**: Collections editorial baseline only. No UI, no CSS, no partner / sponsor work, no Guide work.

This pass transforms Collections from a generic "5-tool list" into a genuine
software-stack decision system, clearly distinct from Catalog, Guides, and
Compare. It happens BEFORE Grok resumes the UI refinement work on main.

---

## 1. ARCHITECTURE

### Collection source of truth

TooolVibes Collections follow a **three-layer** architecture (same as Guides):

| Layer | File | Role | Status |
|-------|------|------|--------|
| **Production Git-first (default)** | `lib/data/content-collections.ts` | Deterministic, Git-versioned editorial baseline | **ACTIVE in production** |
| Legacy mocks (local-only) | `lib/data/mock-collections.ts` | Dev fallback (8 records, includes draft/archived) | Disabled in production by `NODE_ENV !== "production"` check |
| Supabase (opt-in) | `lib/supabase/collection-repository.ts` → `public.collections` + `public.collection_tool_slots` | Future migration target | **DORMANT** — `TOOOLVIBES_COLLECTIONS_SOURCE` is unset in `.env.production` and `.env.local`; default resolves to `content` |

### Data flow (production path)

```
lib/data/content-collections.ts
  ↓
getCollectionRepositorySnapshot()       (lib/data/collection-repository.ts)
  ↓                                       resolves TOOOLVIBES_COLLECTIONS_SOURCE
                                           defaults to "content" → loads content-collections
  ↓
buildCollectionRepositorySnapshot()     (lib/collections/editorial.ts)
  ↓                                       normalizeCollectionRecord (access → "open")
                                           validateCollectionRecord (warnings/errors)
                                           sortCollectionRecords (featured first, then editorial_order)
  ↓
getCuratedCollections()                 (lib/data/public-collections.ts)
  ↓                                       filters isCollectionPublic (published|featured)
                                           filters tool_count > 0
                                           resolves each slot → ResolvedCollectionToolSlot
                                           via resolveCuratedCollection (helpers.ts)
                                           sortCollections
  ↓
app/(marketing)/collections/page.tsx
app/(marketing)/collections/[slug]/page.tsx
```

### Which layer wins?

`getRequestedCollectionsSource()` reads `TOOOLVIBES_COLLECTIONS_SOURCE`:

- `"auto"` or `"content"` (default, **current production**): uses `content-collections.ts`.
- `"supabase"`: uses Supabase, falls back to `content-collections.ts` if Supabase errors.
- `"mock"`: only allowed in non-production (gated by `canUseMockDataFallback()` + `NODE_ENV` check).

**Production currently serves `content-collections.ts`. This push IS the production baseline.**

### Precedence when multiple sources exist

`content` always wins in V1 (the "deterministic public catalog" pattern).
`mock` is only used locally and explicitly. `supabase` is opt-in for a
later migration. There is no merge layer in V1 — single-source resolution
is the rule.

### Schema stability

`public.collections` and `public.collection_tool_slots` are NOT migrated in
this pass. The V2 fields (`stack_meta`, `stack_variants`, `decision_intelligence`,
`anti_recommendation`, `scenario`, slot-level `status`/`stage`/`why_chosen`/
`input`/`output`/`next_handoff`/`learning_curve`/`pricing_relevance`/
`limitations`/`when_to_skip`/`replacement_trigger`/`alternatives`/
`relevant_guide_slug`/`direct_integration_with`/`manual_handoff`) are
added to the **TypeScript** type and the **content file**. They are
**drooped on the floor** if Supabase is later enabled. This is the
intended graceful-degradation path: existing Supabase consumers see no
schema change, new data is Git-first.

### Production implications

- This commit changes the public site on next deploy.
- Production must remain on `content` source after deploy.
- Supabase remains dormant. No sync is required now.
- If the team wants to switch to `supabase` later, see "Production sync
  required" notes in section 12.

---

## 2. ORIGINAL COLLECTION AUDIT

### 2.1 `ai-stack-solo-founders`

**Original tool composition** (5 tools, all "open"):
1. VibeCode — "Dall'idea all'interfaccia"
2. v0 — "Costruzione e rifinitura"
3. Meku — "Superficie di lancio"
4. Frase AI — "Memoria operativa"  ← **forced/incorrect**
5. Jenni AI — "Ricerca"

**Problems found**:
- Frase was used as "Memoria operativa" (operational memory), but Frase is a
  SEO research + content brief + writing platform. Using it as a memory tool
  is a category-mismatch.
- v0 was framed as "Costruzione e rifinitura", overlapping with VibeCode's
  "Dall'idea all'interfaccia" — both are vibe-coding tools, distinct stages
  needed to be made explicit.
- No CORE / OPTIONAL / ALTERNATIVE distinction: the reader saw a flat list
  of 5 tools, no guidance on which was essential.
- No stack variants (LEAN vs BALANCED), no anti-recommendation, no handoff
  transparency, no related-collection graph.
- Jenni AI as "Ricerca" was the most defensible slot.

**Tools removed**:
- **Frase AI** — forced memory role. Kept only as a documented alternative
  to Jenni AI when research becomes SEO-driven.

**Tools retained**:
- VibeCode (now CORE in stage "Build")
- v0 (now OPTIONAL in stage "Iterazione UI")
- Meku (now CORE in stage "Superficie pubblica")
- Jenni AI (now CORE in stage "Ricerca")

**Tools added**:
- **Blink** (ALTERNATIVE to VibeCode for prompt-first builders)
- **Mocha** (ALTERNATIVE to VibeCode when backend is needed from day one)
- **Wegic** (ALTERNATIVE to Meku when the public surface is multi-page)

**Final thesis**: solo founders need a small, opinionated stack — research,
public surface, MVP — with clear alternatives when the use case shifts (faster
prompt, included backend, multi-page site). Stack variants make the LEAN
three-tool version explicit; everything else is OPTIONAL or ALTERNATIVE.

**Final workflow** (LEAN, 3 CORE tools):
```
Jenni AI (research, brief)
  → copy brief manually
Meku (public surface / landing)
  → link to MVP
VibeCode (MVP, prototype navigabile)
  → link from landing
```

**Variant BALANCED** adds v0 (4 CORE tools).

---

### 2.2 `design-sprint-essentials`

**Original tool composition** (4 tools):
1. Imagine Art — "Esplorazione visuale"
2. Meku — "Rifinitura landing"
3. VibeCode — "Prototipo interattivo"
4. Frase AI — "Memoria sprint"  ← **forced/incorrect**

**Problems found**:
- Frase used as "Memoria sprint" (sprint memory) — same category-mismatch as
  in the founder stack. Sprint memory is not a tool: it's a discipline.
- 4 tools with no explicit CORE/OPTIONAL/ALTERNATIVE.
- No variant: a 2-day sprint and a 5-day sprint got the same stack.
- No anti-recommendation: nothing said when this collection was wrong.

**Tools removed**:
- **Frase AI** — forced memory role.

**Tools retained**:
- Imagine Art (CORE, "Esplorazione visuale")
- Meku (CORE, "Superficie di presentazione")
- VibeCode (now OPTIONAL, "Prototipo interattivo")

**Tools added**:
- **v0** (CORE, "Interfaccia") — UI production-grade, fills the gap left
  by removing the "construction" stage.
- **Wegic** (ALTERNATIVE to Meku, for multi-page site sprints)

**Final thesis**: design sprints are about tempo, not coverage. Three or
four stages, each with a tool that does one job, and a clear rule: when
the deliverable is an app, not a landing, swap Meku for VibeCode.

**Final workflow** (LEAN, 3 CORE):
```
Imagine Art (moodboard, direzione visiva)
  → reference selezionati
v0 (UI production-grade)
  → schermate
Meku (landing di sintesi)
  → pubblicazione
```

**Variant BALANCED** adds VibeCode as 4th CORE for interactive prototypes.

---

### 2.3 `creator-video-stack`

**Original tool composition** (4 tools):
1. Vidau — "Motore visuale"
2. **Synthesia AI** — "Editing via testo"  ← **factually wrong**
3. Imagine Art — "Frame dell'idea"
4. Frase AI — "Memoria produzione"  ← **forced/incorrect**

**Problems found**:
- **Synthesia** was described as "Editing via testo" (text-based editing).
  This is factually wrong: Synthesia is an **AI avatar + voiceover** platform
  for talking-head videos (training, corporate, onboarding, multilingual).
  A "text-based editor" is closer to Descript (not in the catalog). The
  misframing is the most damaging editorial error in the baseline.
- Frase as "Memoria produzione" — same forced memory problem.
- No real distinction between roles: "Motore visuale", "Frame dell'idea",
  "Editing via testo" overlap heavily.
- The collection missed the actual creator workflow: script, visual, video
  generation, voiceover, repurposing.

**Tools removed**:
- **Frase AI** — forced memory role.
- **Synthesia's "Editing via testo" label** — replaced with the correct
  "Avatar / Voiceover" framing.

**Tools retained**:
- Vidau (CORE, "Generazione video")
- Imagine Art (CORE, "Visual direction")

**Tools added**:
- **Jenni AI** (CORE, "Scripting") — fills the scripting stage.
- **Synthesia AI** (CORE, "Avatar / Voiceover") — properly described.
- **Blogify** (CORE, "Repurposing") — closes the loop with the blog side.
- **Muse AI** (OPTIONAL, "Hosting") — for variant ADVANCED with 50+ video.
- **VibrantSnap** (ALTERNATIVE to Synthesia, for screen-recording demos)

**Final thesis**: the creator stack is about integrity between script,
visual, video, voiceover, and repurposing. Synthesia is here for its
real role (avatar/voiceover, not text editing). The LEAN variant covers
the core loop without avatar/voiceover; BALANCED adds Synthesia for
corporate/training; ADVANCED adds Muse AI for hosting.

**Final workflow** (LEAN, 4 CORE):
```
Jenni AI (scaletta, claim)
  → script
Imagine Art (frame, moodboard, asset)
  → visual
Vidau (video generation)
  → clip
Blogify (repurposing to blog)
  → article
```

**Variant BALANCED** adds Synthesia for avatar content. **Variant ADVANCED**
adds Muse AI for hosting.

---

## 3. FIVE NEW COLLECTIONS

### 3.4 `ai-content-marketing-stack`

- **Slug**: `ai-content-marketing-stack`
- **Title**: "Stack AI per content marketing"
- **Audience**: Research-led teams (content team 1-3, founder-editor, agenzie 5-15 clienti)
- **Job-to-be-done**: produrre articoli SEO/GEO a velocità costante, con un processo ripetibile
- **Editorial thesis**: il content marketing senza AI è lento, con AI senza metodo è rumore. Servono una piattaforma per la ricerca SEO, una per la scrittura (spesso la stessa), una per i visual, una per il repurposing, una per la distribuzione. Niente tool di nicchia che gonfiano il processo.
- **CORE tools** (LEAN): Frase AI (ricerca + scrittura), Imagine Art (visual), ReachifyMe (distribuzione LinkedIn)
- **CORE tools** (BALANCED): Frase AI, Imagine Art, Blogify, Vidau, ReachifyMe
- **OPTIONAL tools**: Vidau (video leggero, BALANCED), Synthesia AI (avatar explainers)
- **ALTERNATIVES**: Jenni AI (in alternativa a Frase per ricerca non-SEO)
- **Workflow** (LEAN):
  ```
  Frase AI (SERP research + brief + scrittura)
    → brief
  Imagine Art (visual per articolo)
    → assets
  ReachifyMe (distribuzione LinkedIn)
    → post
  ```
- **Approximate cost**: €30-100/mese
- **Setup complexity**: setup iniziale 2-3 giorni; prima routine mensile in 2 settimane
- **Guide relationships**: frase-ai, reachifyme, jenny-ai
- **Related Collections**: creator-video-stack (quando video-first), personal-brand-linkedin-stack (LinkedIn-first)
- **"Not for"**: brand che fanno content solo per awareness senza intento SEO; team che fanno solo video (vedi Creator Video Stack)

### 3.5 `from-mvp-to-sellable-saas`

- **Slug**: `from-mvp-to-sellable-saas`
- **Title**: "Da MVP a SaaS vendibile"
- **Audience**: Indie launchers (founder con MVP funzionante, 0-100 clienti)
- **Job-to-be-done**: trasformare un MVP funzionante in un prodotto che fattura, con supporto di prima linea e automazione tra strumenti
- **Editorial thesis**: questa raccolta copre il DOPO dell'MVP. Non replica lo stack di costruzione (quello è Solo Founder): copre il layer commerciale, fiscale, di prima operations. Lemon Squeezy risolve checkout e tasse come MoR; Tolt entra quando ci sono utenti da trasformare in canale; ChatBot gestisce il primo livello di supporto; Make cuce gli strumenti quando il volume cresce.
- **CORE tools** (LEAN, 2): Lemon Squeezy, ChatBot
- **CORE tools** (BALANCED, 4): Lemon Squeezy, Tolt, ChatBot, Make
- **CORE tools** (ADVANCED, 5): Lemon Squeezy, Tolt, ChatBot, Make, HelpDesk
- **OPTIONAL tools**: HelpDesk (solo ADVANCED)
- **ALTERNATIVES**: AgentX (in alternativa a ChatBot per agent-driven flows)
- **Workflow** (LEAN):
  ```
  Lemon Squeezy (checkout, abbonamenti, tasse)
    → billing
  ChatBot (first-line AI support)
    → escalation
  ```
- **Approximate cost**: €30-100/mese
- **Setup complexity**: 1-2 settimane per la configurazione completa
- **Guide relationships**: lemon-squeezy, tolt
- **Related Collections**: ai-stack-solo-founders (precedente: build), ai-customer-support-stack (successivo: support depth)
- **"Not for"**: pre-revenue (usa Solo Founder); già a 1000+ clienti (enterprise)

### 3.6 `ai-customer-support-stack`

- **Slug**: `ai-customer-support-stack`
- **Title**: "Stack AI per customer support"
- **Audience**: Research-led teams (team supporto 1-3, SaaS 50+ clienti, SMB con volume crescente)
- **Job-to-be-done**: rispondere al volume di richieste in crescita, distinguendo FAQ, live chat umana, ticket strutturati
- **Editorial thesis**: l'errore più comune è comprare ChatBot + LiveChat + HelpDesk + AgentX insieme pensando che più tool = più copertura. In realtà ognuno copre un bisogno diverso: AI conversazionale, chat umana in tempo reale, ticketing strutturato. Qui trovi esattamente i ruoli distinti, una variante LEAN con due soli tool.
- **CORE tools** (LEAN, 2): ChatBot, HelpDesk
- **CORE tools** (BALANCED, 4): ChatBot, HelpDesk, LiveChat, Make
- **OPTIONAL tools**: LiveChat, Make (entrambi in BALANCED)
- **ALTERNATIVES**: AgentX (in alternativa a ChatBot per agent multi-step)
- **Workflow** (LEAN):
  ```
  ChatBot (AI first-line, FAQ, triage)
    → escalation
  HelpDesk (ticket strutturati)
    → risoluzione
  ```
- **Approximate cost**: €30-100/mese
- **Setup complexity**: 1 settimana LEAN; 2-3 settimane BALANCED
- **Guide relationships**: nessuna guida diretta; cross-link con From MVP to Sellable SaaS
- **Related Collections**: from-mvp-to-sellable-saas, ai-agents-automation-stack
- **"Not for"**: pre-lancio o <20 clienti; supporto solo telefonico

### 3.7 `ai-agents-automation-stack`

- **Slug**: `ai-agents-automation-stack`
- **Title**: "Stack AI agents e automazione"
- **Audience**: Research-led teams (founder tecnico, engineering, automation/marketing team)
- **Job-to-be-done**: scegliere e configurare un sistema di agenti AI per un caso d'uso reale (supporto, lead, automazione interna)
- **Editorial thesis**: AgentX, Flowise e Make non vanno usati insieme per partire: hanno ruoli distinti. AgentX è un builder no-code di agent specializzati; Flowise è un builder visuale LangChain-based, più tecnico; Make è orchestration di automazioni, non un agent runtime. Due percorsi puliti, dichiara esplicitamente che mixarli tutti è overkill.
- **CORE tools** (LEAN, 1): AgentX (no-code path) — OR Flowise (self-hosted path); declared as alternatives, not stack
- **CORE tools** (BALANCED, 2): AgentX + Make OR Flowise + Make
- **OPTIONAL tools**: CosmicJS (storage per knowledge base)
- **ALTERNATIVES**: ChatBot (in alternativa a AgentX per semplice chat-only)
- **Workflow** (LEAN no-code):
  ```
  AgentX (agent runtime)
    → tools/API
  ```
  **Workflow** (BALANCED no-code):
  ```
  AgentX (agent runtime)
    → Make (orchestration)
    → CRM/email/tool esterni
  ```
- **Approximate cost**: €30-100/mese
- **Setup complexity**: 1-2 settimane LEAN; 1 mese BALANCED
- **Guide relationships**: flowise-ai, agentxai
- **Related Collections**: ai-customer-support-stack, ai-stack-solo-founders
- **"Not for"**: use case semplici senza decisioni AI (usa solo Make); team senza competenze tecniche a meno di scegliere solo AgentX

### 3.8 `personal-brand-linkedin-stack`

- **Slug**: `personal-brand-linkedin-stack`
- **Title**: "Stack personal brand su LinkedIn"
- **Audience**: Creator teams (professionisti, founder in fase avvio, creator che rilancia LinkedIn)
- **Job-to-be-done**: stabilire una routine editoriale LinkedIn credibile e misurabile
- **Editorial thesis**: il personal brand non è una pila di tool: è una disciplina. BetterPic è spesso citato come "indispensabile", ma se sei già un creator con un headshot decente, non è CORE — è OPTIONAL. ReachifyMe è il centro reale del flusso LinkedIn; Frase AI dà il vantaggio SEO del posizionamento; Imagine Art produce i visual dei post.
- **CORE tools** (LEAN, 2): ReachifyMe, Imagine Art
- **CORE tools** (BALANCED, 4): ReachifyMe, Imagine Art, Frase AI, BetterPic
- **OPTIONAL tools**: Frase AI, BetterPic, Blogify, Windsor AI
- **ALTERNATIVES**: Jenni AI (in alternativa a Frase per long-form)
- **Workflow** (LEAN):
  ```
  ReachifyMe (post LinkedIn)
    + Imagine Art (visual)
    → pubblicazione LinkedIn
  ```
  **Workflow** (BALANCED):
  ```
  BetterPic (headshot one-shot)
  + Frase AI (posizionamento SEO)
    → brief
  ReachifyMe (post LinkedIn)
  + Imagine Art (visual)
    → pubblicazione
  ```
- **Approximate cost**: €0-30/mese
- **Setup complexity**: 1 settimana setup; 1 mese per la prima routine
- **Guide relationships**: betterpic, reachifyme, frase-ai
- **Related Collections**: ai-content-marketing-stack, creator-video-stack
- **"Not for"**: brand già affermato multi-canale (vedi Content Marketing Stack); chi cerca vanity metrics

---

## 4. FINAL 8-COLLECTION INVENTORY

| # | Slug | Intent | Core (LEAN) | Optional | Alternatives | Cost | Difficulty | Setup | Primary Guides |
|---|------|--------|-------------|----------|--------------|------|------------|-------|----------------|
| 1 | `ai-stack-solo-founders` | Founder solo: idea → MVP | 3 (Jenni, Meku, VibeCode) | 1 (v0) | 3 (Blink, Mocha, Wegic) | €0-30 | Starter | Half day | jenny-ai, frase-ai |
| 2 | `design-sprint-essentials` | Sprint design 2-5 giorni | 3 (Imagine, v0, Meku) | 1 (VibeCode) | 1 (Wegic) | €0-30 | Growing | 2-5 days | jenny-ai, frase-ai |
| 3 | `creator-video-stack` | Creator: script → video → repurposing | 4 (Jenni, Imagine, Vidau, Blogify) | 1 (Muse AI) | 1 (VibrantSnap) | €30-100 | Growing | 1-2 days + 2-3 weeks routine | jenny-ai, frase-ai |
| 4 | `ai-content-marketing-stack` | Content marketing SEO/GEO | 3 (Frase, Imagine, ReachifyMe) | 2 (Vidau, Synthesia) | 1 (Jenni) | €30-100 | Growing | 2-3 days + 2 weeks routine | frase-ai, reachifyme, jenny-ai |
| 5 | `from-mvp-to-sellable-saas` | MVP → SaaS operativo | 2 (Lemon Squeezy, ChatBot) | 1 (HelpDesk) | 1 (AgentX) | €30-100 | Growing | 1-2 weeks | lemon-squeezy, tolt |
| 6 | `ai-customer-support-stack` | Supporto AI credibile | 2 (ChatBot, HelpDesk) | 2 (LiveChat, Make) | 1 (AgentX) | €30-100 | Growing | 1-3 weeks | (cross From MVP) |
| 7 | `ai-agents-automation-stack` | Architettura agenti AI | 1 (AgentX OR Flowise) | 1 (CosmicJS) | 1 (ChatBot) | €30-100 | Advanced | 1-4 weeks | flowise-ai, agentxai |
| 8 | `personal-brand-linkedin-stack` | Presenza LinkedIn | 2 (ReachifyMe, Imagine) | 4 (Frase, BetterPic, Blogify, Windsor) | 1 (Jenni) | €0-30 | Starter | 1 week + 1 month | betterpic, reachifyme, frase-ai |

---

## 5. COLLECTION GRAPH

The 8 Collections form a meaningful network, NOT a hub-and-spoke.

```
                       ┌─────────────────────────────────────┐
                       │  ai-stack-solo-founders             │
                       │  (Build the MVP)                    │
                       └──────────┬──────────────────┬───────┘
                                  │                  │
                  (build → MVP)   │                  │  (build → MVP)
                                  ▼                  ▼
                ┌─────────────────────────┐    ┌──────────────────────┐
                │ design-sprint-essentials│    │ from-mvp-to-sellable │
                │ (alternative build path)│    │      -saas           │
                └──────────┬──────────────┘    │  (operate the MVP)   │
                           │                    └──────────┬───────────┘
                (visual alt)│                              │
                           ▼                                ▼
                ┌─────────────────────────┐    ┌──────────────────────┐
                │ creator-video-stack     │    │ ai-customer-support  │
                │ (script → video → blog) │    │      -stack          │
                └──────────┬──────────────┘    │  (support depth)     │
                           │                    └──────────┬───────────┘
              (LinkedIn)   │                              │
                           ▼                              ▼
                ┌─────────────────────────┐    ┌──────────────────────┐
                │ ai-content-marketing    │    │ ai-agents-automation │
                │      -stack             │    │      -stack          │
                │ (SEO + distribution)    │    │  (architecture)      │
                └──────────┬──────────────┘    └──────────────────────┘
                           │
                           ▼
                ┌─────────────────────────┐
                │ personal-brand-linkedin │
                │      -stack             │
                │ (LinkedIn-first brand)  │
                └─────────────────────────┘
```

**Reading the graph**:
- `ai-stack-solo-founders` is the BUILD origin. From there, two paths:
  - to `design-sprint-essentials` (alternative build path: design-first)
  - to `from-mvp-to-sellable-saas` (next stage: operate the MVP)
- `from-mvp-to-sellable-saas` and `ai-customer-support-stack` share `ai-stack-solo-founders` as upstream.
- `ai-customer-support-stack` and `ai-agents-automation-stack` connect through `from-mvp-to-sellable-saas` (operational layer).
- `creator-video-stack` connects to `design-sprint-essentials` (visual overlap) and `ai-content-marketing-stack` (repurposing overlap).
- `ai-content-marketing-stack` connects to `personal-brand-linkedin-stack` (LinkedIn distribution).
- `personal-brand-linkedin-stack` connects back to `ai-content-marketing-stack` (multi-canale).

**No circular nonsense, no forced cross-links**. Each edge has a reason stated
in the corresponding `related_collection_slugs` and `look_instead_at` arrays.

---

## 6. CATALOG GAPS

The following capabilities are missing from the current TooolVibes catalog
(30 tools in `lib/data/tooolvibes-directory.ts`) and prevented stronger
stacks. They are REPORTED here but **not added in this pass**.

### GAP 1: Vector database / RAG storage
- **Category**: AI infrastructure
- **Suggested capability**: vector store with API (Pinecone, Weaviate, Qdrant, Chroma) for self-hosted RAG agents
- **Why it matters**: Flowise + custom RAG is a real use case for technical teams, and the current catalog has no clean storage layer for embeddings
- **Potential tools to evaluate later**: Pinecone, Weaviate, Qdrant, Chroma, Supabase pgvector (the project already uses Supabase, this could be added at the infra level)

### GAP 2: Email transactional / lifecycle
- **Category**: Marketing automation
- **Suggested capability**: email marketing platform with lifecycle automation (welcome, onboarding, retention)
- **Why it matters**: From MVP to Sellable SaaS LEAN variant covers billing + support but not lifecycle email. Lemon Squeezy handles receipts but not onboarding sequences.
- **Potential tools to evaluate later**: Customer.io, Loops, Resend (transactional only), ConvertKit, Brevo

### GAP 3: Analytics / product telemetry
- **Category**: Data & analytics
- **Suggested capability**: product analytics (events, funnels, retention) distinct from marketing attribution
- **Why it matters**: Windsor AI is marketing attribution; SaaS operational decisions need product analytics (PostHog, Amplitude, Mixpanel)
- **Potential tools to evaluate later**: PostHog, Amplitude, Mixpanel, Heap

### GAP 4: Long-form video editor
- **Category**: Video AI / editing
- **Suggested capability**: text-based video editor (close to what current Synthesia description wrongly suggests)
- **Why it matters**: the original `creator-video-stack` misframed Synthesia as a "text editor" because that role doesn't exist in the catalog. Adding it would unblock the creator stack for podcasters, long-form talking-heads, and interview-based content.
- **Potential tools to evaluate later**: Descript, Opus Clip, Captions, Riverside

### GAP 5: Calendar / scheduling
- **Category**: Productivity
- **Suggested capability**: scheduling tool for sales calls, demos, consultations
- **Why it matters**: From MVP to Sellable SaaS would benefit from a CORE scheduling tool when the team moves to sales calls
- **Potential tools to evaluate later**: Cal.com, Calendly, SavvyCal, TidyCal

### GAP 6: Note / PKM tool with API
- **Category**: Productivity
- **Suggested capability**: knowledge management with API access (Notion alternatives)
- **Why it matters**: NotionApps is a good tool, but a dedicated note/knowledge base (Obsidian with sync, Logseq, Tana) would expand personal brand and research workflows
- **Potential tools to evaluate later**: Obsidian (with sync), Logseq, Tana, AnyType

### GAP 7: Phone / SMS / voice AI
- **Category**: Customer support / sales
- **Suggested capability**: AI voice agent for phone support
- **Why it matters**: ChatBot + LiveChat + HelpDesk covers digital support. Phone/SMS is a missing layer for SMB and high-touch B2B.
- **Potential tools to evaluate later**: PolyAI, Vapi, Bland, JustCall

### GAP 8: CRM dedicated
- **Category**: Sales
- **Suggested capability**: dedicated CRM (Socleads is lead gen, not a CRM)
- **Why it matters**: From MVP to Sellable SaaS doesn't have a CORE CRM. Without CRM, sales pipeline visibility stays spreadsheet-level.
- **Potential tools to evaluate later**: HubSpot, Pipedrive, Attio, Folk

### GAP 9: Translation / multilingual content
- **Category**: Content AI
- **Suggested capability**: dedicated AI translation workflow for global content marketing
- **Why it matters**: Synthesia does video multilingual, but text multilingual content marketing is missing.
- **Potential tools to evaluate later**: DeepL, Lokalise, Smartling

### GAP 10: Search / SEO beyond Frase
- **Category**: SEO
- **Suggested capability**: dedicated SEO platform (rank tracking, technical SEO, backlink analysis)
- **Why it matters**: Frase is content-focused; long-term SEO needs Ahrefs / Semrush / SE Ranking
- **Potential tools to evaluate later**: Ahrefs, Semrush, SE Ranking, Mangools

These gaps are NOT added in this pass. The 8 Collections have been built
honestly with the existing catalog, and missing tools have been called out
in the editorial text where relevant (e.g., GAP 4 in creator-video-stack,
GAP 2 in from-mvp-to-sellable-saas).

---

## 7. FACTUAL SOURCE LOG

### PRIMARY SOURCES (official pricing/product/documentation)

- **Lemon Squeezy** — `https://www.lemonsqueezy.com/` — Merchant of Record, payments, tax compliance. Pricing model (free tier + 2% transaction fee) is the well-known public model; precise current rates should be re-verified on official pricing page before any user-facing pricing claim.
- **Make** — `https://www.make.com/` — visual automation platform. Pricing model: usage-based, starts at €9/mo core tier; precise current rates should be re-verified.
- **Tolt** — `https://tolt.com/` — affiliate/referral for SaaS. Integration with Stripe, Paddle, Chargebee stated in official materials.
- **ChatBot** — `https://www.chatbot.com/` — AI chatbot builder for support/sales/FAQ automation.
- **HelpDesk** — `https://www.helpdesk.com/` — ticketing system.
- **LiveChat** — `https://www.livechat.com/` — live chat software.
- **AgentX** — `https://www.agentx.so/` — no-code multi-agent builder.
- **Flowise** — `https://flowiseai.com/` — open-source visual builder for LangChain agents, RAG, chatflows.
- **ReachifyMe** — `https://reachifyme.com/` — LinkedIn content / personal branding AI.
- **BetterPic** — `https://www.betterpic.io/` — AI headshot generator.
- **Synthesia** — `https://www.synthesia.io/` — AI avatar + voiceover video platform.
- **Frase AI** — `https://www.frase.io/` — SEO brief + writing + SERP analysis.
- **Jenni AI** — `https://jenni.ai/` — AI writing/research/citations.
- **VibeCode** — `https://www.vibecodeapp.com/` — app builder, mobile/web.
- **v0** — `https://v0.app/` — Vercel UI builder, components, frontend.
- **Meku** — `https://meku.dev/` — AI React/Tailwind site & web app builder.
- **Imagine Art** — `https://www.imagine.art/` — AI image + video suite.
- **Vidau** — `https://www.vidau.ai/` — AI video ads generator.
- **Blogify** — `https://blogify.ai` — video/audio → blog post repurposing.
- **Muse AI** — `https://muse.ai/` — video hosting + AI search.
- **VibrantSnap** — `https://www.vibrantsnap.com/` — screen recording → demo video.
- **Mocha** — `https://getmocha.com/` — no-code app builder with backend.
- **Blink** — `https://blink.new/` — AI app builder, prompt-to-app.
- **Wegic** — `https://wegic.ai/` — AI website builder, conversational.
- **WeWeb** — `https://dashboard.weweb.io/` — no-code web app builder.
- **CosmicJS** — `https://app.cosmicjs.com/` — headless CMS.
- **Windsor AI** — `https://www.windsor.ai/` — marketing data attribution.
- **Omi** — `https://www.omi.me/` — wearable AI (mentioned in Guides but not in this Collection set).

### SECONDARY / SUPPORTING SOURCES

- **`lib/data/tooolvibes-directory.ts`** — primary authoritative description of each tool's category, segments, level, use cases (used to write `role`, `note`, `why_chosen`, `input`, `output` for each slot).
- **`app/(marketing)/posts/page.tsx`** — confirmed Guide article slugs (FEATURED_SLUGS) used in `related_guide_slugs`.
- **Past Guides editorial work** — confirms that Synthesia is for avatar/voiceover, not generic text editing.

### SECONDARY CLAIMS LABELED

- ChatBot claim "riduce del 40-60% il volume di richieste" is a **vendor claim** — labeled as such in the editorial text ("fonte: claim vendor da verificare sul sito ufficiale"). NOT stated as a verified TooolVibes fact.
- Pricing bands (€0-30, €30-100, etc.) are **indicative editorial estimates** based on publicly visible freemium/paid tiers, not precise quotes. They are clearly labeled as `monthly_cost_band` in `stack_meta`.

### NOT USED AS PRIMARY

- Third-party review sites (G2, Capterra, TrustRadius) were NOT used as primary sources.
- Reddit / LinkedIn / X discussions were NOT used.
- Past content marketing posts about these tools were NOT used to override official product descriptions.

---

## 8. UI DATA REQUIREMENTS FOR GROK

The new V2 data model surfaces additional fields that the Collection UI
should eventually render. The UI redesign is **Grok's responsibility**;
this pass only adds the data.

### Collection-level (rendered on the detail page)

| Field | Where it lives | Suggested rendering |
|-------|----------------|---------------------|
| `stack_meta.concise_promise` | new | Subtitle / hero kicker |
| `stack_meta.job_to_be_done` | new | Above-the-fold secondary line |
| `stack_meta.user_stage` | new | Badge: "Per founder pre-traction" / "Per team 1-3" |
| `stack_meta.setup_time` | new | Icon + "Mezza giornata" / "1 settimana" |
| `stack_meta.monthly_cost_band` | new | Icon + "€30-100/mese" |
| `stack_meta.difficulty_label` | new | Difficulty badge |
| `stack_meta.last_verified` | new | "Verificato 2026-08-10" small caption |
| `stack_meta.related_guide_slugs` | new | "Approfondisci su [Guide]" links |
| `stack_meta.related_collection_slugs` | new | "Vai a [Related Collection]" cards |
| `stack_variants[]` | new | Variant selector (LEAN / BALANCED / ADVANCED) with per-variant tool list |
| `decision_intelligence.strongest` | new | "Punto di forza" callout |
| `decision_intelligence.weakest` | new | "Punto debole" callout |
| `decision_intelligence.fragility` | new | "Dove si rompe" callout |
| `decision_intelligence.vendor_lock_in` | new | "Vendor lock-in" badge |
| `decision_intelligence.data_privacy` | new | "Privacy / dati" callout |
| `decision_intelligence.scalability` | new | "Quando smette di scalare" callout |
| `anti_recommendation.not_for` | new | "Non per te se..." section |
| `anti_recommendation.look_instead_at` | new | "Guarda invece..." links |
| `scenario.title` + `scenario.body` | new | "Esempio reale" scenario card |

### Slot-level (rendered on each tool card inside the collection)

| Field | Where it lives | Suggested rendering |
|-------|----------------|---------------------|
| `stage` | new | "Fase 1 — Ricerca" label |
| `status` | new | "CORE" / "OPZIONALE" / "ALTERNATIVA" badge |
| `why_chosen` | new | "Perché qui" subline |
| `input` | new | "↓ entra" |
| `output` | new | "↓ esce" |
| `next_handoff` | new | "↓ passa a..." |
| `learning_curve` | new | "Curva: bassa/media/alta" |
| `pricing_relevance` | new | Pricing badge |
| `limitations` | new | "Limite onesto" tooltip / callout |
| `when_to_skip` | new | "Quando saltare" hint |
| `replacement_trigger` | new | "Quando sostituire" hint |
| `alternatives[]` | new | "Alternative: [Blink, Mocha]" chips |
| `relevant_guide_slug` | new | "Approfondisci [Guide]" link |
| `direct_integration_with[]` | new | "Integrazione diretta: [VibeCode]" badge (when present) |
| `manual_handoff` (true) | new | "Handoff manuale" indicator |

### Visual hierarchy recommendations (informational, not prescriptive)

- The CORE / OPTIONAL / ALTERNATIVE distinction is the single most important
  visual signal. Without it, the user sees 5 tools and has to figure out
  which are essential. **Render this prominently**.
- The `anti_recommendation` block ("non per te se...") is what makes
  Collections different from a "best of" list. **Render it visibly**,
  not as a small footnote.
- The handoff transparency (`input → output → next_handoff`) is the
  second most important visual signal. **Render it as a flow**, not
  as bullet points.

### What Grok should NOT do

- Do not break the existing route, SEO metadata, or partner module.
- Do not modify the `related_collection_slugs` graph or the data — only
  render it.
- Do not change `access: "open"` semantics (all V1 collections are public).
- Do not regress the existing `included_tools` rendering.

---

## 9. FILES MODIFIED

### Tracked (committed in `dea7dba`)

| File | Type | Change |
|------|------|--------|
| `lib/types/collection.ts` | types | Extended `CollectionToolSlot` (status, stage, why_chosen, input, output, next_handoff, learning_curve, pricing_relevance, limitations, when_to_skip, replacement_trigger, alternatives, relevant_guide_slug, direct_integration_with, manual_handoff) and `CuratedCollectionRecord` (stack_meta, stack_variants, decision_intelligence, anti_recommendation, scenario). Added 5 new type aliases. ResolvedCollectionToolSlot derives is_core / is_optional / is_alternative. |
| `lib/collections/helpers.ts` | resolver | `resolveCuratedCollection` populates derived flags; new `getCollectionCoreSlots` / `getCollectionOptionalSlots` / `getCollectionAlternativeSlots` / `getCollectionVariant` helpers. |
| `lib/data/content-collections.ts` | data | Full rewrite: 3 rebuilt + 5 new = 8 public records with the V2 editorial model. |
| `__tests__/lib/data/public-collections.test.ts` | tests | Updated to expect 8 slugs; added invariant tests. |
| `__tests__/lib/data/collection-repository.test.ts` | tests | Updated to expect 8 slugs. |
| `__tests__/components/collections/collection-slot-card.test.tsx` | tests | Updated test slot to include the new is_core / is_optional / is_alternative flags. |
| `__tests__/lib/data/content-collections-editorial.test.ts` | tests | NEW. 13 editorial invariants: 8-record count, no draft/archived in baseline, tool existence, unique slugs, CORE presence, order uniqueness, related-collection resolution, no self-references, stack_variants discipline, LEAN ≤4 tools, forced-mapping audit (Frase ≠ memoria, Synthesia = avatar/voiceover), rationale length, stack_meta presence. |
| `__tests__/lib/data/content-collections-resolved.test.ts` | tests | NEW. Resolver smoke: every collection resolves without losing slots; stack_variants reference only included_tools. |

### Untracked (NOT committed, NOT in this pass scope)

The following directories are untracked artifacts from previous audits
and were left as-is per the protocol:
- `audits/commercial-final/`
- `audits/commercial-inventory-final/`
- `audits/partner-aurora-final/`
- `audits/partner-brand-assets-v1/`
- `audits/partner-experience-v3-2026-08-07/`
- `audits/partner-final-polish/`
- `audits/partner-inventory-v4/`

---

## 10. VALIDATION

| Command | Result | Notes |
|---------|--------|-------|
| `npm run typecheck` | ✅ PASS | 0 errors, 0 warnings |
| `npm run lint:ci` | ✅ PASS | 0 errors, 0 warnings (max-warnings=0) |
| `npm run test:unit` | ⚠️ 1 pre-existing failure, 1825 passing | Failure: `__tests__/scripts/runtime-contract.test.ts` — local Node 26.5.0 vs project-pinned 22.23.1. Unrelated to this pass. |
| `npm run build` | ✅ PASS | 86/86 pages generated. Routes `/collections` and `/collections/[slug]` compile cleanly. |
| `__tests__/lib/data/content-collections-editorial.test.ts` | ✅ 13/13 PASS | All editorial invariants hold |
| `__tests__/lib/data/content-collections-resolved.test.ts` | ✅ 2/2 PASS | Resolver smoke green |
| `__tests__/lib/data/public-collections.test.ts` | ✅ 3/3 PASS | Updated for 8 records |
| `__tests__/lib/data/collection-repository.test.ts` | ✅ 3/3 PASS | Updated for 8 records |
| `__tests__/components/collections/collection-slot-card.test.tsx` | ✅ 1/1 PASS | Updated test slot |

### Pre-existing unrelated failure

`__tests__/scripts/runtime-contract.test.ts` was failing **before** this
pass started (verified: failure is "Node 22.23.1 required; found 26.5.0").
The project pins Node 22.23.1 via `.node-version` / `nvmrc` / `engines`
in `package.json`. The local shell is on Node 26.5.0. This is a
pre-existing environment mismatch, not introduced by this pass.

**Not opportunistically fixed** per protocol: "If there is a known
PRE-EXISTING unrelated failure: confirm that it already existed before
this pass. Do not opportunistically fix unrelated failures."

---

## 11. CROSS-SCOPE SAFETY

Explicitly confirmed:

- **Guides not modified**: no files under `app/(marketing)/posts/`,
  no `lib/data/public-articles.ts`, no `lib/supabase/article-*` files touched.
- **Collection UI not redesigned**: `app/(marketing)/collections/page.tsx`,
  `app/(marketing)/collections/[slug]/page.tsx`, all
  `components/collections/*.tsx` are UNCHANGED. The new data fields are
  available via `collection.stack_meta`, `collection.stack_variants`, etc.,
  but the existing UI doesn't read them yet — Grok owns the UI.
- **CSS not redesigned**: `styles/` directory untouched, no
  `*.css` files modified.
- **Partner / sponsored / commercial work not modified**: no
  `audits/commercial-*`, no `audits/partner-*`, no `lib/monetization/`,
  no `lib/sponsors/`, no `lib/ads/`, no `lib/affiliates/`, no
  `app/(admin)/admin/`, no `app/sponsorizza/`, no TinyAdz files.
- **No unrelated project areas modified**: no `/home`, `/hero`,
  `/toools`, `/compare`, `/posts`, `/shortlist`, `/studio`,
  `/admin`, `/affiliati`, `/shop`, `/wishlist`, `/radar`, `/tags`,
  `/sponsorizza`, `/metodo`, `/chi-siamo`, `/termini`, `/privacy`,
  `/cookie`, `/contributi`, `/product-hunt`, `/archivio`, `/community`.

### Audits artifacts

The `audits/commercial-final/`, `audits/commercial-inventory-final/`,
`audits/partner-aurora-final/`, `audits/partner-brand-assets-v1/`,
`audits/partner-experience-v3-2026-08-07/`, `audits/partner-final-polish/`,
`audits/partner-inventory-v4/` directories are untracked artifacts from
previous audit rounds. They were NOT staged or modified in this pass.

---

## 12. PRODUCTION STATUS

### Source of truth

- **Git-first**: this commit IS the production baseline.
- `lib/data/content-collections.ts` is read directly by the production
  Collection repository (default `TOOOLVIBES_COLLECTIONS_SOURCE=content`).
- No database migration, no CMS sync required for this commit.

### Production sync required AFTER Grok UI pass

The following will be needed **after** Grok completes the UI refinement:

1. **Supabase schema migration (if team wants to switch source)**:
   - Add columns to `public.collections`:
     - `stack_meta jsonb`
     - `stack_variants jsonb`
     - `decision_intelligence jsonb`
     - `anti_recommendation jsonb`
     - `scenario jsonb`
   - Add columns to `public.collection_tool_slots`:
     - `stage text`
     - `status text` (constrained to `core|optional|alternative`)
     - `why_chosen text`
     - `input text`
     - `output text`
     - `next_handoff text`
     - `learning_curve text` (constrained to `low|medium|high`)
     - `pricing_relevance text`
     - `limitations text`
     - `when_to_skip text`
     - `replacement_trigger text`
     - `alternatives text[]`
     - `relevant_guide_slug text`
     - `direct_integration_with text[]`
     - `manual_handoff boolean`
2. **One-time content sync**: migrate the 8 records from
   `content-collections.ts` to Supabase. The existing
   `lib/admin/collection-mutations.ts` and admin tools can be used, or
   a one-shot script can be authored.
3. **Source switch**: set `TOOOLVIBES_COLLECTIONS_SOURCE=supabase` in
   production env.

**NOT performed in this pass**. The current production source is Git-first
and this push IS the deployment.

### Deployment status

- **NO deploy executed**. No `wrangler deploy`, no `opennextjs-cloudflare deploy`.
- Push only — the team controls when the next deploy happens.
- Cloudflare Pages will pick up this commit on the next deploy run.

### Cache implications

- `app/(marketing)/collections/page.tsx` has `revalidate = 3600` (ISR).
  After deploy, the new 8 records will appear within 1 hour OR on the
  next page request after deploy.
- `app/(marketing)/collections/[slug]/page.tsx` has `revalidate = 3600`.
  Each of the 8 detail pages will pick up the new editorial data on
  next request after deploy.
- No CDN purge needed beyond standard Next.js ISR invalidation.

### No `git push --force`

Push was a normal fast-forward:
```
adaf30a..dea7dba  main -> main
```

Local `main` and `origin/main` are now both at `dea7dba1e48309786870585fceb846dc3e029784`.

---

## 13. BACKLOG (Collection ideas NOT implemented in this pass)

The following Collection ideas were considered and ranked but **not
implemented** per the instruction "Do NOT implement them. Create a ranked
BACKLOG instead." Ranking is editorial usefulness for the TooolVibes
audience, given the current 30-tool catalog.

| Rank | Idea | Catalog coverage | User intent | Decision complexity | Editorial value | Differentiation | Monetization potential | Existing Guides | Score |
|------|------|------------------|-------------|---------------------|-----------------|-----------------|-----------------------|----------------|-------|
| 1 | AI Video Training / Course Stack | High (Synthesia, Blogify, Imagine, Vidau, Muse) | High | Medium | High | High (separate from creator-video by focus on training) | Medium | (cross from existing) | High |
| 2 | Agency Stack (per-client workflow) | Medium (Make, Blogify, Imagine, CosmicJS) | Medium | High | High | High | High | (none direct) | High |
| 3 | Knowledge Worker Stack | Medium (Jenni, Reclaim, Tana-alt, Imagine) | High | Medium | Medium | Medium | Low | reclaim-ai (not in catalog) | Medium |
| 4 | Sales Stack (outbound + CRM) | Low (Socleads, Make, Lemon) — GAP 8 CRM | High | High | High | High | High | (none direct) | High but blocked by GAP 8 |
| 5 | Lead Generation Stack | Medium (Socleads, ReachifyMe, Frase) | High | Medium | High | Medium | High | (cross) | Medium |
| 6 | Startup Launch Stack | Low (overlaps with Solo Founder) | High | Medium | Low (duplicates) | Low | Medium | (cross) | Low |
| 7 | Free / Budget Stack | High (free tier of most tools) | High | Low | Medium | High (price-sensitive audience) | Low | (none) | Medium |
| 8 | Content Website Stack (publishing site) | Medium (Meku, CosmicJS, Blogify, Frase) | Medium | Medium | Medium | Medium | Medium | frase-ai | Medium |
| 9 | Academic / Research Workflow | Medium (Jenni, Frase, Blogify) | Medium | High | Medium | Medium | Low | jenny-ai, frase-ai | Low |
| 10 | Creator Monetization Stack | Low (Lemon, Tolt, ReachifyMe — spread across other stacks) | Medium | High | Medium | Low (duplicates) | High | lemon-squeezy, tolt | Low |

**Top 3 backlog candidates** (after Grok UI pass completes):

1. **AI Video Training / Course Stack** — Synthesia + Blogify + Muse AI +
   optional ReachifyMe. Separate from creator-video-stack by focus
   (training vs entertainment/social).
2. **Agency Stack** — Make + CosmicJS + Blogify + Frase AI. Serves
   a distinct user (agencies running 5-15 client content operations).
3. **Free / Budget Stack** — ReachifyMe + Imagine Art + Jenni AI +
   Meku free tier. Price-sensitive audience, valid for TooolVibes
   positioning as decision support, not luxury.

---

## 14. SUCCESS CRITERIA CHECKLIST

- ✅ architecture was mapped first (section 1)
- ✅ all 3 original Collections were critically rebuilt (section 2)
- ✅ 5 genuinely useful new Collections were created (section 3)
- ✅ total intended Collections = 8 (section 4)
- ✅ every selected tool has a defensible role (each slot has why_chosen,
  limitations, when_to_skip, replacement_trigger)
- ✅ CORE / OPTIONAL / ALTERNATIVE distinctions are explicit
  (status field on every slot, derived is_core/is_optional/is_alternative
  on resolved slots, validated by editorial test)
- ✅ tool handoffs are realistic (input/output/next_handoff on every
  CORE slot, manual_handoff flag where no direct integration exists)
- ✅ no fake integrations were invented (no `direct_integration_with`
  entries; all handoffs flagged manual where appropriate)
- ✅ cost/complexity intelligence is present where supported
  (monthly_cost_band, setup_time, difficulty_label, decision_intelligence
  on every Collection; pricing labels as indicative, not quoted)
- ✅ Collection → Guide relationships are valid
  (related_guide_slugs references the 12 confirmed Guide slugs from
  FEATURED_SLUGS in app/(marketing)/posts/page.tsx)
- ✅ source-of-truth behavior is understood
  (Git-first production, Supabase dormant, no migration this pass)
- ✅ Collection routes remain operational
  (build passes, /collections and /collections/[slug] compile,
  all tests green except pre-existing Node version)
- ✅ typecheck / lint / build pass except documented pre-existing
  unrelated failures (1 runtime-contract test on Node 26 vs 22)
- ✅ only scoped Collection editorial/data files were committed
  (8 files, 2351 insertions, 66 deletions, all under lib/data/content-collections,
  lib/collections/helpers, lib/types/collection, __tests__/.../collections...)
- ✅ main was pushed successfully (origin/main == HEAD == dea7dba)
- ✅ no deployment was performed (no wrangler, no opennextjs-cloudflare)
- ✅ no Guide work was modified
- ✅ no partner / sponsored work was modified
- ✅ no Collection visual redesign was performed

---

## 15. FINAL CLOSURE STATEMENT

**COLLECTIONS EDITORIAL BASELINE PUSHED — READY FOR GROK UI PASS.**

The 8 Collections on `main` (`dea7dba`) are now a genuine software-stack
decision system: each Collection has a job-to-be-done, a clear CORE
stack, declared ALTERNATIVES, optional upgrades, a realistic scenario,
an explicit "non è per te se..." block, and a position in the
related-Collection graph. Every tool slot has a defensible role, an
honest limit, a "when to skip" rule, and a replacement trigger.

The data is Git-first, the production source is the new
`content-collections.ts`, Supabase is dormant. Grok can now resume
visual refinement with a real editorial/data foundation to render.

Gianmaria — passa pure a Grok. Il main è pronto.
