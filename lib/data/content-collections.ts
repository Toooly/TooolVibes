import type { CuratedCollectionRecord } from "@/lib/types/collection";

// V2 public collection source. These records are the deterministic
// Git-first editorial baseline that production reads through the
// `content` source (TOOOLVIBES_COLLECTIONS_SOURCE=content, the default).
//
// Editorial model (V2):
//   - Each Collection is a curated software-stack decision system,
//     NOT a blog post and NOT a "best of" list.
//   - Every tool slot carries CORE / OPTIONAL / ALTERNATIVE status.
//   - Handoffs between tools are honest: when tools don't integrate
//     directly, the slot says so (manual_handoff: true).
//   - Stack variants (lean / balanced / advanced) only appear when
//     the editorial model genuinely supports them.
//   - Each Collection explicitly says when it is NOT the right answer
//     (anti_recommendation) and links to neighbours in the network
//     (related_collection_slugs / stack_meta.related_collection_slugs).
//
// The repository is the source of truth. Supabase is opt-in
// (TOOOLVIBES_COLLECTIONS_SOURCE=supabase) and currently dormant in
// production: enabling it later will require (a) a schema migration
// to add the V2 fields and (b) a one-time content sync. See
// section 12 of the final deliverable report for the safe path.

export const contentCollections: CuratedCollectionRecord[] = [
  // =========================================================================
  // 01 — SOLO FOUNDER AI STACK (rebuild)
  // =========================================================================
  {
    id: "collection-01",
    title: "Stack AI per founder solo",
    slug: "ai-stack-solo-founders",
    description:
      "Una raccolta operativa per chi deve trasformare un'idea in un MVP credibile, gestendo in proprio ricerca, superficie pubblica e prima versione del prodotto senza sovrapporre tool.",
    cover_image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Kit founder",
    rationale:
      "Il founder solo non ha bisogno di una piattaforma che fa tutto. Ha bisogno di una sequenza stretta: ricerca del perimetro, superficie pubblica credibile, prodotto navigabile, e niente di più finché non c'è trazione. Qui non trovi un \"pacchetto da sei tool\": trovi tre ruoli, due alternative e una variante LEAN esplicita — più un'indicazione precisa su quando NON è ancora il momento di aggiungere altro.",
    highlights: [
      "Sequenza breve: ricerca, superficie pubblica, MVP",
      "Ruoli CORE distinti, alternative dichiarate invece di duplicati",
      "Una variante LEAN per founder con budget zero e mezza giornata",
      "Esplicita su quando NON serve ancora aggiungere tool",
    ],
    theme: "founder-stack",
    audience: "Solo founders",
    difficulty: "starter",
    tone: "starter-stack",
    access: "open",
    editorial_state: "featured",
    surface: "collection",
    featured_slot: "home-hero",
    editorial_order: 10,
    stack_meta: {
      concise_promise:
        "Idea, superficie pubblica e MVP gestibili da soli in una mezza giornata.",
      job_to_be_done:
        "Passare da intuizione a MVP navigabile e presentabile, prima di investire tempo in automazioni o pagamenti.",
      user_stage:
        "Founder con un'idea chiara o una prima bozza, prima della traction.",
      last_verified: "2026-08-10",
      setup_time: "Mezza giornata per la variante LEAN; 1-2 giorni per BALANCED.",
      monthly_cost_band: "€0-30",
      difficulty_label: "Starter — curva di accesso bassa.",
      related_guide_slugs: ["jenny-ai", "frase-ai"],
      related_collection_slugs: [
        "design-sprint-essentials",
        "from-mvp-to-sellable-saas",
        "agency-operating-stack",
        "free-budget-ai-stack",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Tre tool, zero costo: il minimo per pensare, presentare e costruire un MVP.",
        core_tool_slugs: ["jenni-ai", "meku", "vibecode"],
        gains: ["Partenza immediata", "Nessun abbonamento ricorrente"],
        trade_offs: [
          "Nessuna iterazione UI separata (v0) — l'iterazione vive dentro VibeCode",
          "Nessuna alternativa di ricerca SEO-flavored",
        ],
      },
      {
        label: "balanced",
        description:
          "Quattro tool: aggiunge v0 per itare componenti UI quando il prototipo cresce.",
        core_tool_slugs: ["jenni-ai", "meku", "vibecode", "v0"],
        gains: [
          "Iterazione UI separata dal build principale",
          "Più controllo sui componenti quando la complessità sale",
        ],
        trade_offs: [
          "Due strumenti AI generatori attivi: serve disciplina per non duplicare lavoro",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "Meku come superficie pubblica — dà credibilità alla pagina prima ancora di costruire il prodotto.",
      weakest:
        "Jenni AI per la ricerca iniziale è un compromesso: è brillante sul primo perimetro, non sulla validazione di mercato vera.",
      fragility:
        "Il passaggio Jenni → Meku è manuale: il brief deve essere copiato e adattato, non c'è integrazione diretta.",
      vendor_lock_in:
        "Basso. Tutti i tool sono sostituibili e i deliverable sono esportabili.",
      data_privacy:
        "I prompt del founder spesso contengono IP: meglio evitare di caricare logica core in strumenti con training on-by-default.",
      scalability:
        "Stack adatto a 0-100 utenti reali. Oltre, conviene migrare a un sistema con billing (vedi From MVP to Sellable SaaS).",
    },
    anti_recommendation: {
      not_for:
        "Founder che hanno già un MVP in produzione e cercano uno stack operativo (meglio From MVP to Sellable SaaS). Non è adatto a chi deve fare SEO content foundation (vedi AI Content Marketing Stack).",
      look_instead_at: [
        "from-mvp-to-sellable-saas",
        "ai-content-marketing-stack",
        "design-sprint-essentials",
      ],
    },
    scenario: {
      title: "Founder individuale con SaaS B2B in beta privata",
      body: "Un founder con 5-10 utenti pilota deve rifare la landing e validare un nuovo flow. Jenni AI lo aiuta a strutturare la value proposition e a raccogliere i punti di friction raccolti dai pilota. Meku diventa la nuova landing. VibeCode produce un prototipo navigabile del flow per i prossimi test utente. Tutto in una mezza giornata, senza pagare nulla.",
    },
    included_tools: [
      {
        tool_slug: "jenni-ai",
        stage: "Ricerca",
        status: "core",
        role: "Ricerca e brief iniziale",
        note: "Per aprire il tema, raccogliere fonti, mettere giù un brief chiaro e una value proposition leggibile prima di toccare il prodotto.",
        why_chosen:
          "Comprime molto bene il tempo tra intuizione e primo perimetro scritto. Utile quando non hai ancora un team e devi pensare ad alta voce con struttura.",
        input: "Un'idea, un problema, le prime ipotesi di posizionamento.",
        output: "Un brief scritto, una scaletta, una value proposition bozza.",
        next_handoff: "Il brief passa a Meku (superficie pubblica) e a VibeCode (MVP).",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non è uno strumento di validazione di mercato: chiude il pensiero, non sostituisce interviste o analisi SERP profonde.",
        when_to_skip:
          "Se hai già un brief pronto o un product spec strutturato, Jenni aggiunge poco.",
        replacement_trigger:
          "Quando la ricerca iniziale diventa SEO-driven e ti serve un'analisi SERP strutturata: passa a Frase AI.",
        alternatives: ["frase-ai"],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "meku",
        stage: "Superficie pubblica",
        status: "core",
        role: "Landing e credibilità pubblica",
        note: "Per trasformare il brief in una pagina che faccia sembrare il progetto più maturo del suo stadio reale. Utile fin dal giorno uno.",
        why_chosen:
          "Ha il miglior time-to-polish tra i builder di TooolVibes. Regge tono, gerarchia e percezione di maturità anche quando il prodotto è ancora fragile.",
        input: "Brief, value proposition, asset visivi minimi.",
        output: "Una landing pubblicabile con dominio custom.",
        next_handoff:
          "La landing linka al prototipo VibeCode o direttamente al tool principale.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non è adatto quando il collo di bottiglia è la logica applicativa, non la presentazione.",
        when_to_skip:
          "Se stai ancora validando l'idea in privato e non vuoi ancora una presenza pubblica.",
        replacement_trigger:
          "Se ti serve un sito completo con molte pagine e blog, valuta Wegic o CosmicJS come alternativa.",
        alternatives: ["wegic", "weweb"],
        order: 2,
      },
      {
        tool_slug: "vibecode",
        stage: "Build",
        status: "core",
        role: "MVP e prototipo navigabile",
        note: "Per trasformare l'idea in un'app mobile/web iterabile. È il punto in cui il founder passa dal pensare al costruire.",
        why_chosen:
          "Buon compromesso tra velocità e sensazione app-like. Permette di pubblicare una prima demo per test utente reale.",
        input: "Il brief, eventuali mockup di v0 o schermi di riferimento.",
        output: "Un'app web/mobile navigabile e pubblicabile.",
        next_handoff:
          "Il prototipo viene linkato dalla landing Meku. L'output di iterazione (v0) può essere integrato dentro VibeCode.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "freemium",
        limitations:
          "Quando la complessità sale (logica vera, integrazioni profonde) il prototipo va migrato in un sistema più solido.",
        when_to_skip:
          "Se il prodotto non è un'app ma una dashboard, un sito o un tool headless: valuta Blink, Mocha o WeWeb.",
        replacement_trigger:
          "Quando servono backend, autenticazione e database integrati: valuta Mocha. Quando serve più velocità pura da prompt: valuta Blink.",
        alternatives: ["blink", "mocha", "weweb"],
        order: 3,
      },
      {
        tool_slug: "v0",
        stage: "Iterazione UI",
        status: "optional",
        role: "Iterazione componenti UI",
        note: "Da aprire solo quando il prototipo VibeCode inizia a chiedere componenti specifici, redesign di schermi o varianti UI veloci.",
        why_chosen:
          "È il riferimento per UI generate da prompt con qualità production-grade. Funziona come \"satellite\" di VibeCode.",
        input: "Una schermata o un componente da ridisegnare.",
        output: "Codice frontend pronto da integrare o ispezionare.",
        next_handoff: "L'output torna dentro VibeCode o in un repository separato.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non genera logica applicativa: solo UI. Usalo per accelerare la parte visuale, non per decidere il back-end.",
        when_to_skip:
          "Se la UI è già gestita interamente da VibeCode o se il prodotto è no-code puro.",
        replacement_trigger:
          "Se la UI diventa un'attività continua ad alto volume, valuta un sistema di design system dedicato.",
        alternatives: [],
        order: 4,
      },
      {
        tool_slug: "blink",
        stage: "Build (alternativa)",
        status: "alternative",
        role: "Alternativa a VibeCode per build prompt-first",
        note: "Sostituisce VibeCode se preferisci un builder che parte più dal prompt puro, con minore attenzione al dettaglio UI.",
        why_chosen:
          "Alta velocità nel passaggio prompt → app, con output più 'pronto da testare' e meno controllabile.",
        input: "Prompt di prodotto.",
        output: "Web app navigabile.",
        next_handoff: "Sostituisce direttamente VibeCode nello stesso stage.",
        direct_integration_with: [],
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Meno adatto quando ti serve controllo su componenti specifici o UI di qualità superiore.",
        when_to_skip:
          "Se la qualità della UI è un fattore critico per la tua traction.",
        replacement_trigger: "Se ti serve più controllo UI, torna a VibeCode o affianca v0.",
        alternatives: ["vibecode", "mocha"],
        order: 5,
      },
      {
        tool_slug: "mocha",
        stage: "Build (alternativa)",
        status: "alternative",
        role: "Alternativa a VibeCode con backend integrato",
        note: "Sostituisce VibeCode quando l'MVP richiede autenticazione, database e pubblicazione integrata fin dal primo giorno.",
        why_chosen:
          "Promette backend + database + auth + hosting in un solo builder. Riduce i passaggi tra costruzione, dati e rilascio.",
        input: "Idea + requisiti di backend.",
        output: "App completa con backend, accesso e pubblicazione.",
        next_handoff: "Sostituisce direttamente VibeCode.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "freemium",
        limitations:
          "Meno flessibile sulla UI rispetto a builder prompt-only puri. Se ti serve UI super-curata, meglio VibeCode + v0.",
        when_to_skip:
          "Se l'MVP è solo front-end o se vuoi massima flessibilità UI.",
        replacement_trigger: "Quando la complessità richiede un back-end custom: passa a WeWeb o a una codebase tradizionale.",
        alternatives: ["vibecode", "weweb"],
        order: 6,
      },
    ],
    created_at: "2026-03-14T09:00:00.000Z",
    updated_at: "2026-08-10T09:00:00.000Z",
    first_published_at: "2026-03-14T12:00:00.000Z",
    published_at: "2026-08-10T09:00:00.000Z",
    source_kind: "content",
  },

  // =========================================================================
  // 02 — DESIGN SPRINT ESSENTIALS (rebuild)
  // =========================================================================
  {
    id: "collection-02",
    title: "Essenziali per design sprint",
    slug: "design-sprint-essentials",
    description:
      "Una raccolta stretta per chi deve validare una direzione prodotto o campagna in pochi giorni: esplorazione visuale, interfaccia, prototipo, superficie presentabile.",
    cover_image_url:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Bundle compatto",
    rationale:
      "Un design sprint non ha bisogno di molti tool: ha bisogno di pochi strumenti, ognuno con un ruolo preciso, e di nessuna sovrapposizione tra loro. Qui trovi una sequenza 1) direzione visuale, 2) interfaccia, 3) prototipo, 4) alternativa quando il deliverable è una landing — più un'indicazione esplicita su cosa NON serve (nessuna memoria, nessun agent).",
    highlights: [
      "Quattro ruoli distinti, zero sovrapposizioni di funzione",
      "Alternative dichiarate invece di varianti dello stesso tool",
      "Pensata per sprint di 2-5 giorni",
      "Esclude esplicitamente i tool che non reggono la velocità di uno sprint",
    ],
    theme: "design-sprint",
    audience: "Designer-builders",
    difficulty: "growing",
    tone: "focused-bundle",
    access: "open",
    editorial_state: "featured",
    surface: "collection",
    featured_slot: "home-secondary",
    editorial_order: 20,
    stack_meta: {
      concise_promise:
        "Quattro ruoli, uno per fase dello sprint, senza duplicazioni.",
      job_to_be_done:
        "Portare una direzione creativa da moodboard a prototipo navigabile o landing credibile in pochi giorni.",
      user_stage:
        "Designer, product designer, founder con vocazione design-first.",
      last_verified: "2026-08-10",
      setup_time: "2-5 giorni per uno sprint completo.",
      monthly_cost_band: "€0-30",
      difficulty_label: "Crescita — richiede brief e reference forti.",
      related_guide_slugs: ["jenny-ai", "frase-ai"],
      related_collection_slugs: [
        "ai-stack-solo-founders",
        "creator-video-stack",
        "lead-generation-stack",
        "free-budget-ai-stack",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Tre tool: solo core. Perfetto per sprint brevi senza app interattiva.",
        core_tool_slugs: ["imagine-art", "v0", "meku"],
        gains: [
          "Massima velocità",
          "Una sola scelta per fase",
        ],
        trade_offs: [
          "Nessun prototipo interattivo: il deliverable è una landing, non un'app navigabile",
        ],
      },
      {
        label: "balanced",
        description:
          "Quattro tool: aggiunge VibeCode quando lo sprint deve chiudere con un prototipo cliccabile.",
        core_tool_slugs: ["imagine-art", "v0", "vibecode", "meku"],
        gains: [
          "Deliverable interattivo + landing di sintesi",
          "Due punti di contatto con stakeholder non tecnici",
        ],
        trade_offs: [
          "Serve disciplina per non duplicare lo stesso schermo tra VibeCode e Meku",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "Imagine Art + v0 come coppia divergente→convergente: direzione visuale e UI production-grade in due passaggi.",
      weakest:
        "Meku può essere ridondante con VibeCode se il deliverable dello sprint è un'app: in quel caso, drop Meku.",
      fragility:
        "Tutti i passaggi sono manuali. Non c'è sincronizzazione automatica tra il prompt Imagine Art, l'output v0 e la pubblicazione Meku.",
      vendor_lock_in: "Basso. Tutti i deliverable sono esportabili e sostituibili.",
      data_privacy:
        "I reference visivi dello sprint sono spesso riservati: meglio evitare prompt con materiali coperti da NDA.",
      scalability:
        "Sprint-oriented. Per continuous design iteration, meglio un sistema con stato persistente.",
    },
    anti_recommendation: {
      not_for:
        "Sprint che richiedono logica di backend o integrazioni reali (vedi AI Agents & Automation). Non adatto se il deliverable è solo un documento strategico.",
      look_instead_at: [
        "ai-stack-solo-founders",
        "ai-agents-automation-stack",
        "creator-video-stack",
      ],
    },
    scenario: {
      title: "Product designer in sprint di 4 giorni per una feature B2B",
      body: "Un product designer riceve brief e 5 reference visive. Giorno 1: usa Imagine Art per materializzare 3 direzioni visive divergenti. Giorno 2: passa le 2 migliori in v0 per generare UI production-grade. Giorno 3: assembla in Meku una landing di sintesi. Giorno 4: consegna + iterazione finale. Tutto il flusso resta in 4 strumenti, tutti sostituibili.",
    },
    included_tools: [
      {
        tool_slug: "imagine-art",
        stage: "Esplorazione visuale",
        status: "core",
        role: "Moodboard e direzione visiva",
        note: "Per aprire lo sprint con esplorazione visuale rapida: prompt, reference, varianti di tono e palette.",
        why_chosen:
          "Buon compromesso tra qualità estetica e velocità. È una suite, quindi copre immagini e short video quando servono entrambi.",
        input: "Brief, reference, moodboard testuali.",
        output: "Asset visivi (immagini, short video) per la fase divergente.",
        next_handoff: "Gli asset selezionati diventano input per v0 e Meku.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "L'output va comunque diretto: le varianti AI non sono mai un deliverable finito.",
        when_to_skip:
          "Se lo sprint è solo text-first (es. microcopy, content strategy) e non ha componente visuale.",
        replacement_trigger:
          "Se lo sprint richiede esclusivamente illustrazione o 3D, valuta tool specialistici fuori catalogo.",
        alternatives: [],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "v0",
        stage: "Interfaccia",
        status: "core",
        role: "Generazione UI e componenti",
        note: "Per portare la direzione visuale in interfacce production-grade con componenti veri.",
        why_chosen:
          "Genera UI pronta per la review di stakeholder tecnici, non solo mockup.",
        input: "Screenshot, reference UI, prompt di layout.",
        output: "Componenti UI, schermate intere, codice frontend.",
        next_handoff:
          "L'output UI alimenta VibeCode (prototipo interattivo) o Meku (landing) a seconda del deliverable.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non genera logica. È uno strumento UI, non un back-end o un sistema dati.",
        when_to_skip:
          "Se lo sprint non produce interfacce (es. brand-only, motion-only, copy-only).",
        replacement_trigger:
          "Quando serve UI ad alto volume con design system, valuta un sistema dedicato.",
        alternatives: [],
        order: 2,
      },
      {
        tool_slug: "meku",
        stage: "Superficie di presentazione",
        status: "core",
        role: "Landing e superficie di sintesi",
        note: "Per chiudere lo sprint con una pagina presentabile: landing di campagna, microsito, pagina di sintesi dello sprint.",
        why_chosen:
          "Ha il miglior time-to-polish per chiudere velocemente senza perdere qualità percepita.",
        input: "Asset visivi, copy, gerarchia.",
        output: "Pagina pubblicabile con dominio custom.",
        next_handoff: "La landing è il deliverable finale dello sprint.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non è un prototipo interattivo. Se lo sprint chiede un'app navigabile, sostituisci con VibeCode.",
        when_to_skip:
          "Se il deliverable dello sprint è un'app, non una landing.",
        replacement_trigger:
          "Quando la presenza pubblica cresce in complessità, valuta Wegic o CosmicJS.",
        alternatives: ["vibecode"],
        order: 3,
      },
      {
        tool_slug: "vibecode",
        stage: "Prototipo interattivo",
        status: "optional",
        role: "Prototipo navigabile",
        note: "Da aggiungere alla variante BALANCED quando lo sprint deve chiudere con un'app navigabile, non solo con una landing.",
        why_chosen:
          "Converte rapidamente l'output UI di v0 in un'app interattiva pubblicabile.",
        input: "UI da v0, brief di interazione.",
        output: "App mobile/web cliccabile.",
        next_handoff:
          "Il prototipo è linkato dalla landing Meku o consegnato direttamente.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "freemium",
        limitations:
          "Non è un sistema production-grade: è un prototipo, non un prodotto finito.",
        when_to_skip:
          "Se lo sprint non ha interazione (es. solo visuale).",
        replacement_trigger:
          "Quando serve più velocità prompt-pura: valuta Blink. Quando serve backend integrato: valuta Mocha.",
        alternatives: ["blink", "mocha"],
        order: 4,
      },
      {
        tool_slug: "wegic",
        stage: "Superficie di presentazione (alternativa)",
        status: "alternative",
        role: "Alternativa a Meku per siti multi-pagina",
        note: "Sostituisce Meku quando lo sprint produce un sito completo (multiple pagine, sezioni), non solo una landing singola.",
        why_chosen:
          "Gestisce siti con più pagine in modo conversazionale, utile quando lo sprint è più ampio.",
        input: "Brief + reference del sito.",
        output: "Sito multi-pagina pubblicato.",
        next_handoff: "Sostituisce Meku nello stesso stage.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Meno controllo puntuale sulla singola pagina rispetto a Meku.",
        when_to_skip:
          "Se lo sprint produce una sola landing, Meku è più diretto.",
        replacement_trigger: "Torna a Meku se torni a un deliverable single-page.",
        alternatives: ["meku", "weweb"],
        order: 5,
      },
    ],
    created_at: "2026-03-13T10:00:00.000Z",
    updated_at: "2026-08-10T09:00:00.000Z",
    first_published_at: "2026-03-13T16:00:00.000Z",
    published_at: "2026-08-10T09:00:00.000Z",
    source_kind: "content",
  },

  // =========================================================================
  // 03 — CREATOR VIDEO + VOICE STACK (rebuild)
  // =========================================================================
  {
    id: "collection-03",
    title: "Stack creator per video e voce",
    slug: "creator-video-stack",
    description:
      "Una raccolta ricalibrata per creator individuali e team contenuto che producono video e parlato: scripting, visual direction, generazione video, avatar/voiceover, repurposing, e opzionalmente hosting.",
    cover_image_url:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Percorso creator",
    rationale:
      "Il punto debole dei creator non è la generazione: è l'integrità del flusso tra script, visual, parlato e distribuzione. Questa raccolta mette in fila gli strumenti in base al ruolo reale — non a una sequenza di categoria. Synthesia è qui per quello che è davvero: avatar e voiceover, non \"editing via testo\". Vidau è il motore video principale. Imagine Art produce i frame di direzione. Blogify chiude il cerchio con il riuso blog.",
    highlights: [
      "Ruoli reali, non categorie: scripting, visual, video, voiceover, repurposing",
      "Synthesia descritta per il suo ruolo effettivo (avatar/voiceover)",
      "Una variante LEAN per chi parte da zero",
      "Esplicita su quando serve un avatar (corporate/training) vs quando basta il creator in camera",
    ],
    theme: "creator-video",
    audience: "Creator teams",
    difficulty: "growing",
    tone: "editorial-picks",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    editorial_order: 30,
    stack_meta: {
      concise_promise:
        "Dall'idea al video pubblicato, con riutilizzo blog, senza tool sovrapposti.",
      job_to_be_done:
        "Produrre un asset video credibile e, quando serve, il suo derivato blog — gestendo script, visual, generazione e parlato.",
      user_stage:
        "Creator con routine editoriale già avviata, team contenuto 1-3 persone.",
      last_verified: "2026-08-10",
      setup_time: "1-2 giorni per il primo video; routine settimanale stabile in 2-3 settimane.",
      monthly_cost_band: "€30-100",
      difficulty_label: "Crescita — richiede disciplina editoriale.",
      related_guide_slugs: ["jenny-ai", "frase-ai"],
      related_collection_slugs: [
        "ai-content-marketing-stack",
        "personal-brand-linkedin-stack",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Quattro tool: scripting, visual, video, repurposing. Senza avatar, senza hosting.",
        core_tool_slugs: ["jenni-ai", "imagine-art", "vidau", "blogify"],
        gains: [
          "Copre l'intero ciclo di un creator individuale",
          "Costo contenuto",
        ],
        trade_offs: [
          "Nessun avatar/voiceover AI: serve il creator in camera o in voce",
        ],
      },
      {
        label: "balanced",
        description:
          "Cinque tool: aggiunge Synthesia per parlato avatar (formazione, corporate, multilingua).",
        core_tool_slugs: [
          "jenni-ai",
          "imagine-art",
          "vidau",
          "synthesia-ai",
          "blogify",
        ],
        gains: [
          "Capacità di produrre video avatar/voiceover senza set",
          "Scalabile su formazione, onboarding, multilingua",
        ],
        trade_offs: [
          "Synthesia è una piattaforma a sé: il workflow si biforca quando entra in gioco",
        ],
      },
      {
        label: "advanced",
        description:
          "Sei tool: aggiunge Muse AI per ospitare la libreria video e renderla ricercabile.",
        core_tool_slugs: [
          "jenni-ai",
          "imagine-art",
          "vidau",
          "synthesia-ai",
          "blogify",
          "muse-ai",
        ],
        gains: [
          "Archivio video hostato e ricercabile",
          "Embed e condivisione gestiti",
        ],
        trade_offs: [
          "Vale la pena solo sopra 50+ video pubblicati",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "Vidau + Imagine Art: prompt → visual direction → video in un flusso breve e gestibile.",
      weakest:
        "Synthesia è un tool specialistico: se il creator non ha bisogno di avatar, è un costo inutile.",
      fragility:
        "Nessuna integrazione diretta tra Vidau, Synthesia, Imagine Art. Tutto è manuale (esporta, importa, riformula prompt).",
      vendor_lock_in: "Medio-basso. I deliverable sono video scaricabili, ma il riuso dipende da Blogify.",
      data_privacy:
        "Voice clone e avatar AI implicano consenso: meglio evitare voci di terzi senza autorizzazione.",
      scalability:
        "La variante LEAN regge fino a 4-8 video/mese. Oltre, conviene investire in Muse AI per l'archivio.",
    },
    anti_recommendation: {
      not_for:
        "Creator che fanno solo long-form podcast parlato senza componente visual (vedi solo Synthesia o solo Blogify). Non adatto a team che producono video cinematografici — servono tool di produzione vera, non presenti nel catalogo TooolVibes.",
      look_instead_at: [
        "ai-content-marketing-stack",
        "personal-brand-linkedin-stack",
      ],
    },
    scenario: {
      title: "Creator educational con pubblicazione bisettimanale",
      body: "Un creator educational pubblica 2 video a settimana. Lunedì: Jenni AI struttura scaletta e claim. Martedì: Imagine Art genera 4-6 frame di direzione. Mercoledì: Vidau produce il video principale a partire da URL e prompt. Giovedì: Blogify converte il video in post blog. Venerdì: pubblicazione. Synthesia entra solo per i moduli formativi in multilingua, non per il talk principale.",
    },
    included_tools: [
      {
        tool_slug: "jenni-ai",
        stage: "Scripting",
        status: "core",
        role: "Scaletta, claim, ricerca",
        note: "Per pensare la scaletta, validare claim, raccogliere fonti. È il momento di pensiero, non di generazione.",
        why_chosen:
          "Buon supporto al pensiero strutturato: aiuta a uscire dalla pagina bianca senza sostituire la voce del creator.",
        input: "Tema, claim iniziale, fonti.",
        output: "Scaletta, bozza di script, claim verificati.",
        next_handoff: "Lo script passa a Vidau o Synthesia per la produzione.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non è un generatore di copy finito: senza editing finale del creator, l'output suona piatto.",
        when_to_skip:
          "Se lo script è già pronto e il creator vuole solo generare visual.",
        replacement_trigger:
          "Quando il focus diventa SEO-driven: passa a Frase AI per scalette con intento di ricerca.",
        alternatives: ["frase-ai"],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "imagine-art",
        stage: "Visual direction",
        status: "core",
        role: "Frame, moodboard, asset visivi",
        note: "Per la direzione visuale: frame del video, thumbnail, asset condivisi, mini-graphic per i social derivati.",
        why_chosen:
          "È una suite: immagini + short video in un solo posto. Riduce il numero di tool da aprire.",
        input: "Brief visuale, reference, palette.",
        output: "Immagini, short video, asset grafici.",
        next_handoff: "Gli asset alimentano Vidau o diventano thumbnail/condivisi.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "La qualità dipende dal prompt: serve una reference library curata.",
        when_to_skip:
          "Se il creator lavora in studio con set fotografico e non ha bisogno di asset AI.",
        replacement_trigger:
          "Se ti serve un design system, valuta tool di design system dedicati.",
        alternatives: [],
        order: 2,
      },
      {
        tool_slug: "vidau",
        stage: "Generazione video",
        status: "core",
        role: "Motore di generazione video",
        note: "Per trasformare URL, immagini e prompt in video ads o clip pronte per i canali.",
        why_chosen:
          "È il riferimento TooolVibes per la generazione video AI orientata alla performance.",
        input: "URL prodotto, immagini, prompt, script.",
        output: "Video ads o clip pronte.",
        next_handoff: "Il video viene pubblicato, embeddato, o inviato a Blogify per repurposing.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "freemium",
        limitations:
          "Non è un editor video tradizionale: editing fine va fatto in tool esterni.",
        when_to_skip:
          "Se devi produrre video cinematici/documentaristici: servono tool specialistici fuori catalogo.",
        replacement_trigger:
          "Se il workflow richiede avatar/voiceover parlato, aggiungi Synthesia.",
        alternatives: ["synthesia-ai", "vibrantsnap"],
        order: 3,
      },
      {
        tool_slug: "synthesia-ai",
        stage: "Avatar / Voiceover",
        status: "core",
        role: "Avatar AI e voiceover per video parlato",
        note: "Per produrre video con avatar AI e voiceover, ideale per formazione, onboarding, contenuti corporate e multilingua. NON è un editor video generico.",
        why_chosen:
          "Riferimento per video avatar AI: permette di produrre contenuti parlati senza set, camera, speaker.",
        input: "Script testuale, lingua, scelta avatar.",
        output: "Video con avatar parlante e voiceover.",
        next_handoff: "Il video avatar è pubblicato come asset autonomo o embeddato.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "paid",
        limitations:
          "Non è adatto a creator che vogliono mostrare il proprio volto: l'avatar è un sostituto, non un effetto.",
        when_to_skip:
          "Se il creator è il volto del brand e il pubblico si aspetta lui in camera.",
        replacement_trigger:
          "Se il video richiede screen recording trasformato in demo: passa a VibrantSnap.",
        alternatives: ["vibrantsnap"],
        order: 4,
      },
      {
        tool_slug: "blogify",
        stage: "Repurposing",
        status: "core",
        role: "Da video/audio a blog post SEO-ready",
        note: "Per trasformare il video in un articolo, estendendo la vita utile del contenuto.",
        why_chosen:
          "Chiude il cerchio: senza Blogify, il creator spesso spreca il valore SEO del video.",
        input: "URL del video, trascrizione, link al canale.",
        output: "Blog post SEO-ready.",
        next_handoff: "Il blog post va pubblicato e linkato dal video.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "L'articolo generato va riletto: Blogify velocizza, non sostituisce l'editing.",
        when_to_skip:
          "Se il video non ha potenziale blog (es. puro entertainment senza angle testuale).",
        replacement_trigger:
          "Se il workflow richiede ottimizzazione SEO continua, valuta Frase AI come alternativa o complemento.",
        alternatives: ["frase-ai"],
        order: 5,
      },
      {
        tool_slug: "muse-ai",
        stage: "Hosting (opzionale)",
        status: "optional",
        role: "Hosting e ricerca nella libreria video",
        note: "Da aggiungere nella variante ADVANCED quando l'archivio video supera i 50 asset e serve embed + ricerca interna.",
        why_chosen:
          "Combina hosting + ricerca semantica. Alternativa intelligente a YouTube-only quando serve embed nativo.",
        input: "Video pubblicati, libreria esistente.",
        output: "Archivio video hostato, ricercabile, embeddabile.",
        next_handoff: "L'archivio è usato da sito, knowledge base, portali.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "freemium",
        limitations:
          "Non è un social network: se la reach è la priorità, YouTube resta meglio.",
        when_to_skip:
          "Se la libreria è piccola (<20 video) e l'hosting YouTube basta.",
        replacement_trigger:
          "Se la priorità diventa search su libreria molto grande (200+), valuta una soluzione dedicata.",
        alternatives: [],
        order: 6,
      },
      {
        tool_slug: "vibrantsnap",
        stage: "Demo prodotto (alternativa)",
        status: "alternative",
        role: "Alternativa a Synthesia per demo prodotto",
        note: "Sostituisce Synthesia quando il video da produrre è una demo di prodotto (screen recording trasformato in demo curata).",
        why_chosen:
          "Specializzato su screen recording → demo/tutorial. Migliora la qualità percepita delle demo SaaS.",
        input: "Screen recording grezzo.",
        output: "Demo video curata.",
        next_handoff: "Sostituisce Synthesia nello stesso stage.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non genera avatar parlanti: è focalizzato su demo, non su contenuti corporate.",
        when_to_skip:
          "Se serve un avatar AI parlante, non un upgrade di screen recording.",
        replacement_trigger: "Torna a Synthesia quando serve un avatar.",
        alternatives: ["synthesia-ai"],
        order: 7,
      },
    ],
    created_at: "2026-03-12T11:00:00.000Z",
    updated_at: "2026-08-10T09:00:00.000Z",
    first_published_at: "2026-03-12T15:00:00.000Z",
    published_at: "2026-08-10T09:00:00.000Z",
    source_kind: "content",
  },

  // =========================================================================
  // 04 — AI CONTENT MARKETING STACK (new)
  // =========================================================================
  {
    id: "collection-04",
    title: "Stack AI per content marketing",
    slug: "ai-content-marketing-stack",
    description:
      "Una raccolta per team che producono contenuti SEO e GEO a velocità: ricerca SERP, scrittura, visual, repurposing, distribuzione. Una sequenza chiusa, con varianti per chi pubblica 4 articoli al mese e chi pubblica 20+.",
    cover_image_url:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Kit content",
    rationale:
      "Il content marketing senza AI è lento, con AI senza metodo è rumore. Questa raccolta definisce un perimetro stretto: una sola piattaforma per la ricerca SEO, una per la scrittura (che spesso coincide), una per i visual, una per il repurposing, una per la distribuzione LinkedIn. Niente tool di nicchia che gonfiano il processo.",
    highlights: [
      "Sequenza chiusa: SERP, scrittura, visual, repurposing, distribuzione",
      "Una sola piattaforma per fase, senza duplicazioni",
      "Variante LEAN per 4 articoli/mese; BALANCED per 8-12",
      "Esplicita su quando GEO/SEO è irrilevante (brand-only, founder-led)",
    ],
    theme: "research-synthesis",
    audience: "Research-led teams",
    difficulty: "growing",
    tone: "focused-bundle",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    editorial_order: 40,
    stack_meta: {
      concise_promise:
        "Ricerca, scrittura, visual, repurposing e distribuzione in un flusso chiuso.",
      job_to_be_done:
        "Produrre articoli SEO/GEO a velocità costante, con un processo ripetibile.",
      user_stage:
        "Content team 1-3 persone, founder-editor, agenzie con 5-15 clienti.",
      last_verified: "2026-08-10",
      setup_time: "Setup iniziale 2-3 giorni; prima routine mensile in 2 settimane.",
      monthly_cost_band: "€30-100",
      difficulty_label: "Crescita — richiede metodo editoriale preesistente.",
      related_guide_slugs: ["frase-ai", "reachifyme", "jenny-ai"],
      related_collection_slugs: [
        "creator-video-stack",
        "personal-brand-linkedin-stack",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Tre tool: Frase (ricerca + scrittura), Imagine Art (visual), ReachifyMe (distribuzione).",
        core_tool_slugs: ["frase-ai", "imagine-art", "reachifyme"],
        gains: [
          "Coperto l'intero ciclo editoriale",
          "Una sola piattaforma per fase",
        ],
        trade_offs: [
          "Nessun repurposing dedicato: il riuso è manuale",
          "Nessun video: solo static post",
        ],
      },
      {
        label: "balanced",
        description:
          "Cinque tool: aggiunge Blogify (repurposing) e Vidau (video leggero per i social).",
        core_tool_slugs: [
          "frase-ai",
          "imagine-art",
          "blogify",
          "vidau",
          "reachifyme",
        ],
        gains: [
          "Repurposing automatico video→blog",
          "Varianti video per i social",
        ],
        trade_offs: [
          "Vidau ha un costo: vale la pena sopra 8 articoli/mese",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "Frase AI come piattaforma unica per ricerca + scrittura: riduce il numero di tool attivi.",
      weakest:
        "ReachifyMe è LinkedIn-specific. Se la distribuzione è multi-canale, non basta.",
      fragility:
        "Frase → Imagine Art è un passaggio manuale (esporta brief, importa in prompt visuale).",
      vendor_lock_in:
        "Medio. Il know-how su Frase AI non è trasferibile a tool alternativi senza costo.",
      data_privacy:
        "I brief contengono spesso IP del content team: occhio ai tier con training on-by-default.",
      scalability:
        "La variante LEAN regge 4 articoli/mese. Oltre, conviene Blogify per il riuso.",
    },
    anti_recommendation: {
      not_for:
        "Brand che fanno content solo per awareness senza intento SEO (vedi Personal Brand Stack). Non adatto se il focus è esclusivamente video-first (vedi Creator Video Stack).",
      look_instead_at: [
        "creator-video-stack",
        "personal-brand-linkedin-stack",
      ],
    },
    scenario: {
      title: "Content team B2B SaaS, 8 articoli al mese",
      body: "Un team di 2 produce 8 articoli/mese sul blog B2B. Lunedì-martedì: Frase AI per keyword research e brief. Mercoledì-giovedì: scrittura su Frase AI. Venerdì: Imagine Art per visual. Lunedì successivo: Blogify riusa i vecchi video in articoli. ReachifyMe distribuisce 3 post LinkedIn a settimana. Tutto il workflow sta in 5 strumenti.",
    },
    included_tools: [
      {
        tool_slug: "frase-ai",
        stage: "Ricerca + Scrittura",
        status: "core",
        role: "Ricerca SERP, brief, scrittura",
        note: "Per l'intero ciclo di ricerca e scrittura SEO: keyword research, brief, ottimizzazione. È la piattaforma editoriale centrale.",
        why_chosen:
          "Riduce il salto tra keyword research, brief e pubblicazione. Un solo posto dove ragionare sull'intento di ricerca.",
        input: "Topic, keyword, competitor URL.",
        output: "Brief SEO, scaletta, articolo ottimizzato.",
        next_handoff: "L'articolo va pubblicato, e alimenta Imagine Art per i visual.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Richiede un metodo editoriale preesistente: senza brief template, il team si perde.",
        when_to_skip:
          "Se il content è puramente brand senza intento SEO.",
        replacement_trigger:
          "Se serve scrittura accademica con citazioni forti, valuta Jenni AI come supporto parallelo.",
        alternatives: ["jenni-ai"],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "imagine-art",
        stage: "Visual",
        status: "core",
        role: "Asset visivi per gli articoli",
        note: "Per hero image, grafiche inline, social card. È la suite visual del content marketing.",
        why_chosen:
          "Copre immagini + short video: utile per articoli che vogliono spezzare il ritmo con un visual non stock.",
        input: "Brief visuale, articolo di riferimento.",
        output: "Asset grafici e short video.",
        next_handoff: "Gli asset entrano nell'articolo o nei post social.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Gli stock AI si riconoscono: serve una reference library per non sembrare generico.",
        when_to_skip:
          "Se il content è solo long-form testuale senza visual.",
        replacement_trigger: "Se ti serve un design system vero, valuta tool dedicati.",
        alternatives: [],
        order: 2,
      },
      {
        tool_slug: "blogify",
        stage: "Repurposing",
        status: "core",
        role: "Da video/audio a blog post",
        note: "Per chiudere il cerchio: prende i video esistenti (anche di Synthesia/Vidau) e li trasforma in articoli SEO.",
        why_chosen:
          "Massimizza il ROI degli asset esistenti. Trasforma un singolo video in un articolo + snippet social.",
        input: "URL del video, trascrizione, argomento.",
        output: "Blog post SEO-ready, snippet, outline social.",
        next_handoff: "L'articolo passa a Frase AI per l'ottimizzazione finale.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "L'articolo generato va riletto e integrato con dati proprietari.",
        when_to_skip:
          "Se non si dispone di video/audio preesistenti da riusare.",
        replacement_trigger: "Se il volume di repurposing diventa >20/mese, valuta un sistema dedicato.",
        alternatives: [],
        order: 3,
      },
      {
        tool_slug: "reachifyme",
        stage: "Distribuzione",
        status: "core",
        role: "Distribuzione LinkedIn del content",
        note: "Per portare ogni articolo su LinkedIn con un taglio editoriale dedicato (non solo link sharing).",
        why_chosen:
          "LinkedIn è il canale B2B con il miglior ROI organico. ReachifyMe gestisce la routine di pubblicazione.",
        input: "Articolo, angle LinkedIn, calendario editoriale.",
        output: "Post LinkedIn pubblicati, performance tracciata.",
        next_handoff: "I post generano traffico verso il blog, che alimenta il funnel.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Solo LinkedIn: se la distribuzione è multi-canale, serve integrazione.",
        when_to_skip:
          "Se LinkedIn non è un canale prioritario per il brand.",
        replacement_trigger: "Se la distribuzione si allarga a Twitter/X o community, valuta un tool multi-canale.",
        alternatives: [],
        order: 4,
      },
      {
        tool_slug: "vidau",
        stage: "Video leggero",
        status: "optional",
        role: "Varianti video per i social",
        note: "Da aggiungere nella variante BALANCED quando il team vuole produrre 2-4 short video al mese a partire dagli articoli.",
        why_chosen:
          "Velocità di generazione video per testare varianti. Utile per i canali che premiano il video.",
        input: "Articolo, URL, prompt visuale.",
        output: "Short video per social.",
        next_handoff: "Il video è postato o riusato da Blogify.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Non è un editor video tradizionale: per qualità cinematografica servono tool esterni.",
        when_to_skip:
          "Se il canale è solo long-form scritto.",
        replacement_trigger: "Se la produzione video diventa routine critica, valuta Synthesia per parlato.",
        alternatives: ["synthesia-ai"],
        order: 5,
      },
      {
        tool_slug: "synthesia-ai",
        stage: "Avatar / Voiceover",
        status: "optional",
        role: "Avatar per video formativi o multilingua",
        note: "Per articoli che diventano video avatar (es. formazione, demo corporate, versioni multilingua).",
        why_chosen:
          "Permette di produrre video parlato senza set. Utile per articoli complessi che meritano una versione video.",
        input: "Script (spesso la sezione principale dell'articolo).",
        output: "Video avatar parlante.",
        next_handoff: "Il video è embeddato nell'articolo o distribuito su LinkedIn.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "paid",
        limitations:
          "L'avatar è un sostituto, non un effetto: se il brand ha un volto riconoscibile, Synthesia è un trade-off.",
        when_to_skip:
          "Se il brand ha già un volto riconoscibile da mettere in camera.",
        replacement_trigger: "Se serve demo prodotto, valuta VibrantSnap.",
        alternatives: ["vibrantsnap"],
        order: 6,
      },
      {
        tool_slug: "jenni-ai",
        stage: "Ricerca (alternativa)",
        status: "alternative",
        role: "Alternativa a Frase per ricerca non-SEO",
        note: "Sostituisce Frase AI quando il focus è scrittura accademica, documenti lunghi, o ricerca con citazioni strutturate.",
        why_chosen:
          "Miglior supporto a citazioni e documenti lunghi rispetto a Frase.",
        input: "Tema, fonti, claim.",
        output: "Documento con citazioni.",
        next_handoff: "Sostituisce Frase nello stesso stage.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non ha l'analisi SERP di Frase: meno adatto al content marketing SEO puro.",
        when_to_skip:
          "Se il focus è SEO, Frase è la scelta giusta.",
        replacement_trigger: "Torna a Frase quando il focus torna a SEO-driven.",
        alternatives: ["frase-ai"],
        order: 7,
      },
    ],
    created_at: "2026-08-10T09:00:00.000Z",
    updated_at: "2026-08-10T09:00:00.000Z",
    first_published_at: "2026-08-10T09:00:00.000Z",
    published_at: "2026-08-10T09:00:00.000Z",
    source_kind: "content",
  },

  // =========================================================================
  // 05 — FROM MVP TO SELLABLE SAAS (new)
  // =========================================================================
  {
    id: "collection-05",
    title: "Da MVP a SaaS vendibile",
    slug: "from-mvp-to-sellable-saas",
    description:
      "Una raccolta operativa per chi ha già un MVP e deve trasformarlo in un prodotto che fattura: checkout, tasse, affiliazioni, supporto di prima linea, automazione tra strumenti.",
    cover_image_url:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Operatività SaaS",
    rationale:
      "Questa raccolta copre ciò che succede DOPO che il MVP funziona. Non replica lo stack di costruzione (quello è in Solo Founder): copre il layer commerciale, fiscale e di prima operations. Lemon Squeezy risolve il checkout e le tasse come Merchant of Record; Tolt entra quando ci sono utenti da trasformare in canale; ChatBot gestisce il primo livello di supporto; Make cuce gli strumenti tra loro quando il volume cresce.",
    highlights: [
      "Strettamente operativo: presuppone un MVP funzionante",
      "Lemon Squeezy come MoR toglie il peso di tasse e compliance",
      "Tolt solo dopo le prime 10 conversioni reali",
      "Esplicita su quando NON serve ancora (es. <5 clienti paganti)",
    ],
    theme: "indie-launch",
    audience: "Indie launchers",
    difficulty: "growing",
    tone: "starter-stack",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    editorial_order: 50,
    stack_meta: {
      concise_promise:
        "Il layer commerciale e operativo minimo per un SaaS in early revenue.",
      job_to_be_done:
        "Trasformare un MVP funzionante in un prodotto che fattura, con supporto di prima linea e automazione tra strumenti.",
      user_stage:
        "Founder con MVP funzionante e 0-100 clienti. Non adatto a pre-revenue.",
      last_verified: "2026-08-10",
      setup_time: "1-2 settimane per la configurazione iniziale completa.",
      monthly_cost_band: "€30-100",
      difficulty_label: "Crescita — richiede disciplina fiscale e di supporto.",
      related_guide_slugs: ["lemon-squeezy", "tolt"],
      related_collection_slugs: [
        "ai-stack-solo-founders",
        "ai-customer-support-stack",
        "lead-generation-stack",
        "agency-operating-stack",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Due tool: Lemon Squeezy + ChatBot. Il minimo per vendere e rispondere ai primi clienti.",
        core_tool_slugs: ["lemon-squeezy", "chatbot"],
        gains: [
          "Subito operativo",
          "Costo minimo",
        ],
        trade_offs: [
          "Nessun programma affiliazione: i primi clienti arrivano solo da canali diretti",
          "Nessuna automazione: tutto manuale sotto i 50 clienti",
        ],
      },
      {
        label: "balanced",
        description:
          "Quattro tool: aggiunge Tolt (affiliati) e Make (automazione tra Lemon Squeezy, ChatBot, e il resto dello stack).",
        core_tool_slugs: ["lemon-squeezy", "tolt", "chatbot", "make"],
        gains: [
          "Canale affiliazione misurabile",
          "Automazione tra i punti chiave",
        ],
        trade_offs: [
          "Make ha una curva di setup: non aggiungerlo prima di avere 50+ clienti",
        ],
      },
      {
        label: "advanced",
        description:
          "Cinque tool: aggiunge HelpDesk per tickets strutturati quando il supporto cresce oltre il chatbot.",
        core_tool_slugs: [
          "lemon-squeezy",
          "tolt",
          "chatbot",
          "make",
          "helpdesk",
        ],
        gains: [
          "Supporto strutturato con SLA",
          "Separazione tra AI first-line e team",
        ],
        trade_offs: [
          "HelpDesk è overkill sotto i 200 clienti",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "Lemon Squeezy come Merchant of Record: toglie completamente il peso di tasse internazionali e fatturazione.",
      weakest:
        "Tolt ha senso solo sopra 10-20 clienti paganti. Sotto è overhead.",
      fragility:
        "Lemon Squeezy → Tolt → ChatBot non sono integrati nativamente: Make diventa necessario per connetterli quando il volume cresce.",
      vendor_lock_in:
        "Medio. Lemon Squeezy gestisce billing: uscire è costoso in termini di migrazione dati cliente.",
      data_privacy:
        "I dati di fatturazione sono gestiti dal MoR: la privacy è demandata a Lemon Squeezy.",
      scalability:
        "La variante LEAN regge fino a 50 clienti. BALANCED fino a 500. ADVANCED oltre.",
    },
    anti_recommendation: {
      not_for:
        "Pre-revenue (usa Solo Founder Stack). Non adatto a chi ha già 1000+ clienti e cerca un sistema enterprise.",
      look_instead_at: [
        "ai-stack-solo-founders",
        "ai-customer-support-stack",
      ],
    },
    scenario: {
      title: "Indie SaaS con 30 clienti paganti, in crescita organica",
      body: "Un founder ha 30 clienti paganti su Lemon Squeezy. Decide di aprire un programma affiliazione: Tolt si collega a Stripe/Lemon Squeezy. ChatBot gestisce le prime 50 conversazioni/mese. Make collega Lemon Squeezy a ChatBot: ogni nuovo cliente riceve un'email automatica con un link al chatbot di onboarding. Tutto sta in 4 strumenti, costo mensile sotto €100.",
    },
    included_tools: [
      {
        tool_slug: "lemon-squeezy",
        stage: "Pagamenti",
        status: "core",
        role: "Checkout, abbonamenti, tasse",
        note: "Per gestire checkout, abbonamenti e tasse come Merchant of Record. Riduce la complessità fiscale e di compliance.",
        why_chosen:
          "Risolve il problema fiscale per prodotti digitali internazionali senza dover gestire IVA e tasse locali.",
        input: "Prodotto, pricing, paesi di vendita.",
        output: "Checkout attivo, abbonamenti ricorrenti, fatture emesse.",
        next_handoff: "I dati cliente alimentano Make, ChatBot, e l'email marketing.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "paid",
        limitations:
          "Non è un sistema enterprise: per esigenze B2B molto custom, valuta Stripe diretto.",
        when_to_skip:
          "Se devi vendere in paesi o condizioni che Lemon Squeezy non copre (verifica sul sito ufficiale).",
        replacement_trigger: "Se il GMV diventa molto alto, valuta confronto costo con Stripe + Paddle.",
        alternatives: [],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "chatbot",
        stage: "Supporto first-line",
        status: "core",
        role: "Chatbot AI per FAQ e triage",
        note: "Per automatizzare le prime risposte: FAQ comuni, richieste base, instradamento al supporto umano quando serve.",
        why_chosen:
          "Riduce il tempo di risposta nelle prime 48h, dove si giocano la maggior parte delle cancellazioni.",
        input: "Knowledge base, FAQ, logiche di escalation.",
        output: "Conversazioni automatizzate, handoff al team umano.",
        next_handoff: "Le escalation arrivano a HelpDesk (variante ADVANCED) o al team via email.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non risolve richieste complesse: serve un knowledge base curato e aggiornato.",
        when_to_skip:
          "Se hai meno di 20 clienti e il founder risponde direttamente.",
        replacement_trigger:
          "Se il volume richiede agent-driven flows complessi: valuta AgentX.",
        alternatives: ["agentx"],
        order: 2,
      },
      {
        tool_slug: "tolt",
        stage: "Affiliazione",
        status: "core",
        role: "Programma affiliate e referral",
        note: "Da aprire quando ci sono 10-20 clienti paganti e si vuole trasformare utenti/partner in un canale di crescita.",
        why_chosen:
          "Si integra con i principali payment provider, gestisce commissioni e tracking.",
        input: "Programma affiliazione, link, commissioni.",
        output: "Partner attivi, conversioni tracciate, commissioni pagate.",
        next_handoff: "Le conversioni alimentano Make e la pipeline dati.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Richiede utenti soddisfatti disposti a promuovere: senza qualità del prodotto, l'affiliazione non funziona.",
        when_to_skip:
          "Sotto i 10 clienti paganti: è overhead.",
        replacement_trigger: "Se la rete affiliati diventa molto grande, valuta tool enterprise.",
        alternatives: [],
        order: 3,
      },
      {
        tool_slug: "make",
        stage: "Automazione",
        status: "core",
        role: "Glue tra Lemon Squeezy, Tolt, ChatBot e il resto dello stack",
        note: "Per collegare i punti dello stack: nuovi clienti → email di onboarding → handoff al chatbot → sync con Tolt.",
        why_chosen:
          "Make gestisce flussi complessi con logica condizionale, meglio di Zapier per esigenze non banali.",
        input: "Trigger da Lemon Squeezy / Tolt / ChatBot.",
        output: "Azioni automatiche su CRM, email, dashboard.",
        next_handoff: "I dati confluiscono in dashboard e CRM.",
        manual_handoff: true,
        learning_curve: "high",
        pricing_relevance: "paid",
        limitations:
          "Ha un costo per operazione: va ottimizzato, non va usato per qualsiasi cosa.",
        when_to_skip:
          "Sotto i 50 clienti: meglio gestire manualmente i flussi.",
        replacement_trigger: "Se i flussi crescono >50k operazioni/mese, valuta un layer custom.",
        alternatives: [],
        order: 4,
      },
      {
        tool_slug: "helpdesk",
        stage: "Supporto strutturato",
        status: "optional",
        role: "Ticketing per supporto strutturato",
        note: "Da aggiungere nella variante ADVANCED quando il volume di richieste richiede SLA, priorità e assegnazioni.",
        why_chosen:
          "Quando email + ChatBot non bastano più: tickets, priorità, automazioni, SLA.",
        input: "Richieste via email, form, chat.",
        output: "Tickets organizzati, risoluzione tracciata, SLA rispettati.",
        next_handoff: "Le risoluzioni alimentano la knowledge base e il chatbot.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Overhead significativo: va adottato solo quando il team supporto è >1 persona.",
        when_to_skip:
          "Sotto i 200 clienti: ChatBot + email bastano.",
        replacement_trigger: "Se l'azienda ha bisogno di SLA enterprise, valuta tool dedicati.",
        alternatives: ["chatbot"],
        order: 5,
      },
      {
        tool_slug: "agentx",
        stage: "Supporto (alternativa)",
        status: "alternative",
        role: "Alternativa a ChatBot per agent-driven support",
        note: "Sostituisce ChatBot quando il supporto richiede agent AI specializzati con logica multi-step, non solo FAQ.",
        why_chosen:
          "Capacità multi-agent e logica business-oriented. Più potente ma più complesso di ChatBot.",
        input: "Knowledge base, logiche di escalation, tools.",
        output: "Conversazioni gestite da agent specializzati.",
        next_handoff: "Sostituisce ChatBot nello stesso stage.",
        manual_handoff: true,
        learning_curve: "high",
        pricing_relevance: "paid",
        limitations:
          "Richiede tempo di setup e tuning. Non adatto a team non tecnici.",
        when_to_skip:
          "Se il supporto è 80% FAQ e 20% escalation: ChatBot basta.",
        replacement_trigger: "Torna a ChatBot se il supporto si semplifica.",
        alternatives: ["chatbot"],
        order: 6,
      },
    ],
    created_at: "2026-08-10T09:00:00.000Z",
    updated_at: "2026-08-10T09:00:00.000Z",
    first_published_at: "2026-08-10T09:00:00.000Z",
    published_at: "2026-08-10T09:00:00.000Z",
    source_kind: "content",
  },

  // =========================================================================
  // 06 — AI CUSTOMER SUPPORT STACK (new)
  // =========================================================================
  {
    id: "collection-06",
    title: "Stack AI per customer support",
    slug: "ai-customer-support-stack",
    description:
      "Una raccolta chirurgica per costruire un supporto clienti credibile senza sovrapporre tool: AI first-line, live chat umana, ticketing strutturato, automazione tra loro.",
    cover_image_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Supporto AI",
    rationale:
      "L'errore più comune è comprare ChatBot + LiveChat + HelpDesk + AgentX insieme pensando che più tool = più copertura. In realtà ognuno di questi copre un bisogno diverso: AI conversazionale, chat umana in tempo reale, ticketing strutturato. Qui trovi esattamente i ruoli distinti, una variante LEAN con due soli tool, e una nota onesta su quando NON serve un sistema strutturato.",
    highlights: [
      "Ogni tool ha un ruolo distinto, niente sovrapposizioni",
      "Variante LEAN con solo ChatBot + HelpDesk",
      "AgentX presentato come alternativa, non come aggiunta",
      "Esplicita su quando NON serve ancora un supporto strutturato",
    ],
    theme: "indie-launch",
    audience: "Research-led teams",
    difficulty: "growing",
    tone: "focused-bundle",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    editorial_order: 60,
    stack_meta: {
      concise_promise:
        "Un supporto AI credibile con i ruoli distinti, senza sommare tool.",
      job_to_be_done:
        "Rispondere al volume di richieste in crescita, distinguendo FAQ, live chat umana, e ticket strutturati.",
      user_stage:
        "Team supporto 1-3 persone, SaaS con 50+ clienti, SMB con volume crescente.",
      last_verified: "2026-08-10",
      setup_time: "1 settimana per la variante LEAN; 2-3 settimane per la BALANCED.",
      monthly_cost_band: "€30-100",
      difficulty_label: "Crescita — richiede conoscenza del proprio volume di richieste.",
      related_guide_slugs: ["jenny-ai", "tolt"],
      related_collection_slugs: [
        "from-mvp-to-sellable-saas",
        "ai-agents-automation-stack",
        "agency-operating-stack",
        "lead-generation-stack",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Due tool: ChatBot (AI first-line) + HelpDesk (ticket strutturati). Il minimo per non perdere richieste.",
        core_tool_slugs: ["chatbot", "helpdesk"],
        gains: [
          "Subito operativo",
          "Costo minimo",
        ],
        trade_offs: [
          "Nessuna live chat umana: il cliente scrive e aspetta",
          "Nessuna automazione: i flussi sono manuali",
        ],
      },
      {
        label: "balanced",
        description:
          "Quattro tool: aggiunge LiveChat (conversazione umana) e Make (automazione tra ChatBot e HelpDesk).",
        core_tool_slugs: ["chatbot", "helpdesk", "livechat", "make"],
        gains: [
          "Chat umana disponibile",
          "Handoff automatico chatbot → ticket o umano",
        ],
        trade_offs: [
          "LiveChat richiede team disponibile: inutile se non c'è chi risponde",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "ChatBot come primo livello: riduce del 40-60% il volume di richieste che arrivano al team umano (fonte: claim vendor da verificare sul sito ufficiale).",
      weakest:
        "HelpDesk è overhead se i volumi sono <100 tickets/mese.",
      fragility:
        "ChatBot → HelpDesk: se l'AI non sa gestire una richiesta, l'handoff deve essere esplicito. Senza escalation, il cliente resta bloccato.",
      vendor_lock_in:
        "Medio. I ticket e la knowledge base sono lock-in forti.",
      data_privacy:
        "Le conversazioni di supporto contengono dati sensibili. Verifica conformità GDPR del vendor scelto.",
      scalability:
        "La variante LEAN regge fino a 100 clienti. BALANCED fino a 1000. Oltre, serve un sistema enterprise.",
    },
    anti_recommendation: {
      not_for:
        "Pre-lancio o <20 clienti: il founder risponde direttamente. Non adatto se il supporto è solo telefonico (i tool qui sono digital-first).",
      look_instead_at: [
        "from-mvp-to-sellable-saas",
        "ai-agents-automation-stack",
      ],
    },
    scenario: {
      title: "SMB SaaS con 200 clienti, supporto via web",
      body: "Un team di 2 gestisce supporto per 200 clienti. ChatBot assorbe 60% delle richieste (FAQ, password, fatture). Le richieste complesse finiscono in HelpDesk con priorità. LiveChat è attivo in orario lavorativo. Make collega ChatBot e HelpDesk: quando l'AI non sa rispondere, crea un ticket automatico. Il team umano gestisce solo i ticket aperti.",
    },
    included_tools: [
      {
        tool_slug: "chatbot",
        stage: "AI first-line",
        status: "core",
        role: "Chatbot AI per FAQ e triage",
        note: "Per gestire il volume di richieste semplici: FAQ, troubleshooting base, raccolta info per escalation.",
        why_chosen:
          "Riferimento TooolVibes per chatbot AI customer support con knowledge base integrata.",
        input: "Knowledge base, FAQ, regole di escalation.",
        output: "Conversazioni automatizzate, handoff al team umano o a HelpDesk.",
        next_handoff: "Le escalation arrivano a HelpDesk o a LiveChat.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "La qualità dipende dalla knowledge base. Una knowledge base scadente = chatbot inutile.",
        when_to_skip:
          "Se il supporto è 100% umano e ad alto tocco (es. servizi professionali).",
        replacement_trigger: "Se servono agent multi-step con logica business, valuta AgentX.",
        alternatives: ["agentx"],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "helpdesk",
        stage: "Ticketing",
        status: "core",
        role: "Sistema di ticket strutturato",
        note: "Per organizzare le richieste che richiedono risposta umana strutturata: priorità, assegnazione, SLA.",
        why_chosen:
          "Quando email e chat non bastano più. Tickets, priorità, automazioni, knowledge base.",
        input: "Email, form, escalation da ChatBot.",
        output: "Tickets organizzati, risoluzioni tracciate, SLA rispettati.",
        next_handoff: "Le risoluzioni alimentano la knowledge base di ChatBot.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Overhead significativo: serve un team che lo usi davvero.",
        when_to_skip:
          "Sotto i 100 clienti o <50 tickets/mese: ChatBot + email bastano.",
        replacement_trigger: "Se l'azienda ha bisogno di SLA enterprise, valuta tool dedicati.",
        alternatives: ["livechat"],
        order: 2,
      },
      {
        tool_slug: "livechat",
        stage: "Chat umana",
        status: "optional",
        role: "Chat live umana sul sito",
        note: "Per quando il cliente vuole parlare con una persona in tempo reale durante la navigazione.",
        why_chosen:
          "Utile in fase di vendita, onboarding, e per richieste ad alto tocco.",
        input: "Conversazioni dal sito.",
        output: "Risposte in tempo reale, conversione, soddisfazione.",
        next_handoff: "Le conversazioni che richiedono follow-up finiscono in HelpDesk.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "paid",
        limitations:
          "Richiede team disponibile in tempo reale: inutile se non c'è chi risponde.",
        when_to_skip:
          "Se il team supporto è <2 persone o non c'è copertura oraria continua.",
        replacement_trigger: "Quando il volume live è >50 chat/giorno, valuta routing intelligente.",
        alternatives: ["helpdesk"],
        order: 3,
      },
      {
        tool_slug: "make",
        stage: "Automazione",
        status: "optional",
        role: "Glue tra ChatBot, HelpDesk, LiveChat e il resto dello stack",
        note: "Per collegare i tool: nuove email → ticket HelpDesk, escalation ChatBot → notifica Slack, fine conversazione → CRM.",
        why_chosen:
          "Make gestisce logica condizionale, timer, e integrazioni multiple.",
        input: "Trigger da ChatBot / HelpDesk / email / CRM.",
        output: "Azioni automatiche su HelpDesk, CRM, notifiche, email.",
        next_handoff: "I dati alimentano dashboard e reportistica.",
        manual_handoff: true,
        learning_curve: "high",
        pricing_relevance: "paid",
        limitations:
          "Ha un costo per operazione: va ottimizzato.",
        when_to_skip:
          "Sotto i 50 clienti: meglio gestire manualmente.",
        replacement_trigger: "Se i flussi superano le decine di migliaia di operazioni/mese.",
        alternatives: [],
        order: 4,
      },
      {
        tool_slug: "agentx",
        stage: "AI first-line (alternativa)",
        status: "alternative",
        role: "Alternativa a ChatBot per agent multi-step",
        note: "Sostituisce ChatBot quando il supporto richiede agent specializzati con logica complessa, non solo FAQ.",
        why_chosen:
          "Multi-agent, logica business-oriented, integrazione con tool esterni.",
        input: "Knowledge base, tools, logiche di escalation.",
        output: "Conversazioni gestite da agent specializzati.",
        next_handoff: "Sostituisce ChatBot nello stesso stage.",
        manual_handoff: true,
        learning_curve: "high",
        pricing_relevance: "paid",
        limitations:
          "Richiede tuning e competenze tecniche. Non adatto a team non tecnici.",
        when_to_skip:
          "Se il supporto è 80% FAQ.",
        replacement_trigger: "Torna a ChatBot se il supporto si semplifica.",
        alternatives: ["chatbot"],
        order: 5,
      },
    ],
    created_at: "2026-08-10T09:00:00.000Z",
    updated_at: "2026-08-10T09:00:00.000Z",
    first_published_at: "2026-08-10T09:00:00.000Z",
    published_at: "2026-08-10T09:00:00.000Z",
    source_kind: "content",
  },

  // =========================================================================
  // 07 — AI AGENTS + AUTOMATION STACK (new)
  // =========================================================================
  {
    id: "collection-07",
    title: "Stack AI agents e automazione",
    slug: "ai-agents-automation-stack",
    description:
      "Una raccolta tecnica per chi deve scegliere un'architettura di agenti AI: due percorsi distinti (no-code vs self-hosted) con i tool giusti per ciascuno, senza pretendere che servano tutti insieme.",
    cover_image_url:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Architettura agenti",
    rationale:
      "AgentX, Flowise e Make non vanno usati insieme per partire: hanno ruoli distinti. AgentX è un builder no-code di agent specializzati; Flowise è un builder visuale LangChain-based, più tecnico; Make è orchestration di automazioni, non un agent runtime. Questa raccolta presenta due percorsi puliti — no-code (AgentX + Make) e self-hosted/visual (Flowise + Make) — e dichiara esplicitamente che mixarli tutti è overkill.",
    highlights: [
      "Due percorsi distinti: no-code vs self-hosted",
      "AgentX e Flowise sono ALTERNATIVE, non complementari",
      "Make come orchestration layer condiviso",
      "Onesto su quale percorso è per chi",
    ],
    theme: "indie-launch",
    audience: "Research-led teams",
    difficulty: "advanced",
    tone: "special-issue",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    editorial_order: 70,
    stack_meta: {
      concise_promise:
        "Decidere l'architettura di agenti AI: no-code o self-hosted, senza sommare tutto.",
      job_to_be_done:
        "Scegliere e configurare un sistema di agenti AI per un caso d'uso reale (supporto, lead, automazione interna).",
      user_stage:
        "Founder tecnico, team engineering, team automation/marketing con competenze tecniche.",
      last_verified: "2026-08-10",
      setup_time: "1-2 settimane per la variante LEAN; 1 mese per BALANCED.",
      monthly_cost_band: "€30-100",
      difficulty_label:
        "Avanzato — richiede competenze tecniche (almeno basic Python/API per il self-hosted).",
      related_guide_slugs: ["flowise-ai", "agentxai", "frase-ai"],
      related_collection_slugs: [
        "ai-customer-support-stack",
        "ai-stack-solo-founders",
        "agency-operating-stack",
      ],
      // Architectural split: this Collection has two real architectures
      // (managed no-code vs self-hosted) that share Make as orchestration
      // but swap the agent runtime. Rendered side-by-side in the
      // variant section, not as additive tabs.
      path_split: {
        a: {
          label: "Managed (no-code)",
          tagline: "Parti subito, senza devops, gestito da AgentX.",
          core_slugs: ["agentx", "make"],
        },
        b: {
          label: "Self-hosted (LangChain)",
          tagline: "Controllo completo, hosting tuo, richiede engineering.",
          core_slugs: ["flowise", "make"],
        },
      },
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Un solo tool a scelta: AgentX (no-code) OPPURE Flowise (visual/LangChain). Senza Make, senza RAG custom.",
        core_tool_slugs: ["agentx"],
        gains: [
          "Subito operativo",
          "Nessun devops richiesto",
        ],
        trade_offs: [
          "Capacità limitate: agent semplici, niente orchestrazione estesa",
        ],
        // Architectural split: this Collection has two real
        // architectures (managed no-code vs self-hosted) that share
        // Make as orchestration but swap the agent runtime. The
        // variant section renders as side-by-side paths instead of
        // additive tabs.
        architectural: true,
      },
      {
        label: "balanced",
        description:
          "Due tool: AgentX (o Flowise) + Make come orchestration. Permette di collegare gli agent a tool esterni.",
        core_tool_slugs: ["agentx", "make"],
        gains: [
          "Agenti collegati a CRM, email, database",
          "Flessibilità di automazione",
        ],
        trade_offs: [
          "Make ha un costo per operazione",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "AgentX per chi vuole partire senza devops; Flowise per chi vuole controllo LangChain completo.",
      weakest:
        "Flowise richiede hosting: non è una soluzione chiavi-in-mano. Per team non tecnici, AgentX è preferibile.",
      fragility:
        "Gli agent AI sbagliano: serve supervisione umana (human-in-the-loop) per casi critici. Nessun tool risolve questo da solo.",
      vendor_lock_in:
        "Alto se scegli AgentX (piattaforma chiusa); medio con Flowise (open-source, ma LangChain è una dipendenza).",
      data_privacy:
        "Gli agent AI accedono a dati interni. Self-hosted (Flowise) dà più controllo. Cloud (AgentX) è più comodo ma dati escono.",
      scalability:
        "AgentX regge fino a qualche migliaio di conversazioni/mese. Flowise regge di più, ma richiede engineering.",
    },
    anti_recommendation: {
      not_for:
        "Use case semplici che non richiedono agent (es. automazioni lineari senza decisioni → usa solo Make). Non adatto a team senza competenze tecniche di base, a meno di scegliere solo AgentX.",
      look_instead_at: [
        "ai-customer-support-stack",
        "ai-stack-solo-founders",
      ],
    },
    scenario: {
      title: "Team marketing automation che vuole un agente lead-qualification",
      body: "Un team marketing vuole un agente che qualifichi lead via email e chat. Sceglie il percorso no-code: AgentX per costruire l'agent con knowledge base prodotto, Make per collegarlo al CRM e al sistema email. L'agent risponde alle prime domande, qualifica, e passa i lead qualificati al CRM. Tutto in 2 settimane, senza devops.",
    },
    included_tools: [
      {
        tool_slug: "agentx",
        stage: "Agent runtime (no-code)",
        status: "core",
        role: "Builder di agent specializzati no-code",
        note: "Per chi vuole costruire agent AI senza scrivere codice. Multi-agent, knowledge base integrata, logiche di escalation.",
        why_chosen:
          "Riferimento TooolVibes per agent no-code con capacità multi-agent. Accessibile a team non-engineering.",
        input: "Knowledge base, logiche, tools.",
        output: "Agent AI attivi, conversazioni gestite.",
        next_handoff: "Gli agent si collegano a tool esterni via Make o API.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Non è self-hosted: i dati passano per la piattaforma.",
        when_to_skip:
          "Se serve controllo completo su LangChain o hosting on-prem.",
        replacement_trigger: "Se servono agent LangChain complessi con RAG custom, passa a Flowise.",
        alternatives: ["flowise"],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "flowise",
        stage: "Agent runtime (alternativa self-hosted)",
        status: "alternative",
        role: "Alternativa a AgentX per il percorso self-hosted LangChain",
        note: "Sostituisce AgentX quando il team vuole agent AI self-hosted con LangChain, più controllo, più competenze richieste.",
        why_chosen:
          "Open-source, LangChain-based, visuale. Riferimento per chi vuole agent AI senza vendor lock-in.",
        input: "Knowledge base, LangChain components, tools.",
        output: "Agent AI self-hosted, RAG pipelines.",
        next_handoff: "Sostituisce AgentX nello stesso stage; si espone via API o si collega a Make.",
        manual_handoff: true,
        learning_curve: "high",
        pricing_relevance: "free",
        limitations:
          "Richiede hosting (Docker/cloud) e competenze LangChain. Non è chiavi-in-mano.",
        when_to_skip:
          "Se il team non ha competenze tecniche di base o non ha tempo per il setup iniziale.",
        replacement_trigger: "Se il team vuole uscire dall'hosting, valuta AgentX (cloud).",
        alternatives: ["agentx"],
        order: 2,
      },
      {
        tool_slug: "make",
        stage: "Orchestration",
        status: "core",
        role: "Glue tra agent e tool esterni",
        note: "Per collegare l'agent (AgentX o Flowise) a CRM, email, database, e tool esterni.",
        why_chosen:
          "Make gestisce logica condizionale, timer, integrazioni multiple. Riferimento per orchestration visuale.",
        input: "Trigger dall'agent o da tool esterni.",
        output: "Azioni su CRM, email, dashboard.",
        next_handoff: "I dati alimentano report e dashboard.",
        manual_handoff: true,
        learning_curve: "high",
        pricing_relevance: "paid",
        limitations:
          "Ha un costo per operazione: va ottimizzato.",
        when_to_skip:
          "Se l'agent è completamente isolato e non deve comunicare con tool esterni.",
        replacement_trigger: "Se i flussi superano le decine di migliaia di operazioni/mese.",
        alternatives: [],
        order: 3,
      },
      {
        tool_slug: "chatbot",
        stage: "Agent runtime (alternativa)",
        status: "alternative",
        role: "Alternativa a AgentX per chat-only semplice",
        note: "Sostituisce AgentX quando serve un chatbot semplice (solo conversazione, niente multi-agent).",
        why_chosen:
          "Più semplice e meno costoso di AgentX. Sufficiente per FAQ-driven use case.",
        input: "Knowledge base, FAQ.",
        output: "Conversazioni automatizzate.",
        next_handoff: "Le escalation vanno a HelpDesk o al team.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non è multi-agent: niente orchestrazione complessa.",
        when_to_skip:
          "Se serve multi-agent o logica business complessa.",
        replacement_trigger: "Torna ad AgentX se il caso d'uso cresce.",
        alternatives: ["agentx"],
        order: 4,
      },
      {
        tool_slug: "cosmicjs",
        stage: "Storage (opzionale)",
        status: "optional",
        role: "CMS headless per knowledge base e dati agent",
        note: "Per dare agli agent una knowledge base strutturata e gestibile.",
        why_chosen:
          "CMS headless con API, AI e flussi. Buon supporto per dati strutturati.",
        input: "Contenuti, modelli, dati.",
        output: "API documentali per gli agent.",
        next_handoff: "Gli agent interrogano CosmicJS via API.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "freemium",
        limitations:
          "Richiede modellazione dei contenuti: non è plug-and-play.",
        when_to_skip:
          "Se la knowledge base è gestibile come documenti semplici.",
        replacement_trigger: "Se serve un vector store vero, valuta tool dedicati (Pinecone, Weaviate, etc.) fuori catalogo.",
        alternatives: [],
        order: 5,
      },
    ],
    created_at: "2026-08-10T09:00:00.000Z",
    updated_at: "2026-08-10T09:00:00.000Z",
    first_published_at: "2026-08-10T09:00:00.000Z",
    published_at: "2026-08-10T09:00:00.000Z",
    source_kind: "content",
  },

  // =========================================================================
  // 08 — PERSONAL BRAND + LINKEDIN STACK (new)
  // =========================================================================
  {
    id: "collection-08",
    title: "Stack personal brand su LinkedIn",
    slug: "personal-brand-linkedin-stack",
    description:
      "Una raccolta per professionisti e founder che vogliono costruire visibilità su LinkedIn: headshot opzionale, posizionamento, contenuti, visual, distribuzione, repurposing. Onesta su cosa è CORE e cosa è OPTIONAL.",
    cover_image_url:
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "LinkedIn stack",
    rationale:
      "Il personal brand non è una pila di tool: è una disciplina. BetterPic è spesso citato come \"indispensabile\", ma se sei già un creator con un headshot decente, non è CORE — è OPTIONAL. ReachifyMe è il centro reale del flusso LinkedIn; Frase AI dà il vantaggio SEO del posizionamento; Imagine Art produce i visual dei post. Qui trovi ruoli distinti, non un kit da influencer.",
    highlights: [
      "BetterPic esplicitamente OPTIONAL (non serve se hai già un headshot)",
      "ReachifyMe come unica piattaforma LinkedIn-core",
      "Frase AI per posizionamento SEO-driven, non per vanity writing",
      "Onesta su quando NON serve un investimento tool (es. brand già affermato)",
    ],
    theme: "creator-video",
    audience: "Creator teams",
    difficulty: "starter",
    tone: "starter-stack",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    editorial_order: 80,
    stack_meta: {
      concise_promise:
        "Gli strumenti minimi per costruire presenza LinkedIn, senza gonfiare il kit.",
      job_to_be_done:
        "Stabilire una routine editoriale LinkedIn credibile e misurabile.",
      user_stage:
        "Professionista o founder in fase di avvio presenza, oppure creator che vuole rilanciare LinkedIn.",
      last_verified: "2026-08-10",
      setup_time: "1 settimana per setup; 1 mese per la prima routine.",
      monthly_cost_band: "€0-30",
      difficulty_label: "Starter — richiede solo costanza editoriale.",
      related_guide_slugs: ["betterpic", "reachifyme", "frase-ai"],
      related_collection_slugs: [
        "ai-content-marketing-stack",
        "creator-video-stack",
        "ai-video-training-stack",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Due tool: ReachifyMe (LinkedIn) + Imagine Art (visual). Il minimo per partire.",
        core_tool_slugs: ["reachifyme", "imagine-art"],
        gains: [
          "Subito operativo",
          "Costo minimo",
        ],
        trade_offs: [
          "Nessun posizionamento SEO-driven: il copy è basato su best practice, non su ricerca",
          "Nessun headshot AI: usa quello che hai",
        ],
      },
      {
        label: "balanced",
        description:
          "Quattro tool: aggiunge Frase AI (posizionamento) e BetterPic (headshot se serve).",
        core_tool_slugs: [
          "reachifyme",
          "imagine-art",
          "frase-ai",
          "betterpic",
        ],
        gains: [
          "Posizionamento basato su ricerca SERP",
          "Headshot AI curato (se serve)",
        ],
        trade_offs: [
          "Frase AI vale la pena solo se pubblichi 4+ post/mese",
          "BetterPic è one-shot: paghi una volta",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "ReachifyMe + Imagine Art: produce un post LinkedIn completo (copy + visual) in 15 minuti.",
      weakest:
        "BetterPic è one-shot. Se hai già un headshot, è uno spreco.",
      fragility:
        "ReachifyMe → LinkedIn è il passaggio principale. Le metriche (Windsor AI) sono opzionali.",
      vendor_lock_in:
        "Basso. I post sono esportabili, le visual sono in Imagine Art, il copy è in Frase AI.",
      data_privacy:
        "Il profilo LinkedIn è già un dato pubblico. I tool qui non aggiungono privacy concerns significative.",
      scalability:
        "La variante LEAN regge fino a 4 post/mese. BALANCED per 4-8 post/mese.",
    },
    anti_recommendation: {
      not_for:
        "Creator con brand già affermato che ha bisogno di multi-canale (vedi AI Content Marketing Stack). Non adatto a chi cerca vanity metrics: i tool qui sono per costruire sostanza, non follower.",
      look_instead_at: [
        "ai-content-marketing-stack",
        "creator-video-stack",
      ],
    },
    scenario: {
      title: "Consulente B2B che parte da zero su LinkedIn",
      body: "Un consulente B2B vuole costruire presenza LinkedIn. BetterPic genera un headshot professionale. Frase AI identifica 5 topic chiave dove il consulente ha competenza reale. ReachifyMe struttura 4 post/mese. Imagine Art produce i visual. Dopo 3 mesi, il consulente ha una routine editoriale stabile e 2000 impression medie per post.",
    },
    included_tools: [
      {
        tool_slug: "reachifyme",
        stage: "Content production",
        status: "core",
        role: "Piattaforma LinkedIn dedicata",
        note: "Per la produzione di post LinkedIn con routine editoriale: idee, copy, scheduling, analytics base.",
        why_chosen:
          "Riferimento TooolVibes per LinkedIn content. Riduce la frizione di pensare \"cosa pubblicare oggi\".",
        input: "Temi, idee, calendario editoriale.",
        output: "Post LinkedIn pubblicati, performance tracciata.",
        next_handoff: "I post generano connessioni, commenti, DM.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Solo LinkedIn: se vuoi multi-canale, serve un tool diverso.",
        when_to_skip:
          "Se LinkedIn non è un canale prioritario per la tua professione.",
        replacement_trigger: "Se vuoi multi-canale, valuta un tool di social media management dedicato.",
        alternatives: [],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "imagine-art",
        stage: "Visual",
        status: "core",
        role: "Visual per i post LinkedIn",
        note: "Per i visual dei post: card, grafiche, mini-immagini. La suite visual del personal brand.",
        why_chosen:
          "Immagini + short video in un solo posto. Utile per spezzare il ritmo testuale di LinkedIn.",
        input: "Brief visuale, post di riferimento.",
        output: "Asset grafici per i post.",
        next_handoff: "Gli asset entrano nel post LinkedIn.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Serve una reference library: senza stile definito, i visual sembrano generici.",
        when_to_skip:
          "Se ti basta testo senza visual (raro su LinkedIn nel 2026).",
        replacement_trigger: "Se la complessità visual cresce, valuta un tool di design system.",
        alternatives: [],
        order: 2,
      },
      {
        tool_slug: "frase-ai",
        stage: "Posizionamento",
        status: "optional",
        role: "Ricerca SERP per posizionamento",
        note: "Per identificare topic ad alto potenziale dove posizionarsi. Utile quando il personal brand vuole authority SEO.",
        why_chosen:
          "Porta la disciplina SEO nel personal brand. Trova topic dove il competitor è debole.",
        input: "Aree di competenza, competitor.",
        output: "Lista di topic prioritizzati, brief, outline.",
        next_handoff: "I brief alimentano i post LinkedIn.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Senza metodo editoriale, Frase produce una lista che non diventa mai post.",
        when_to_skip:
          "Se pubblichi <4 post/mese o se non ti interessa l'authority SEO-driven.",
        replacement_trigger: "Se vuoi anche blog, valuta il Content Marketing Stack completo.",
        alternatives: ["jenni-ai"],
        order: 3,
      },
      {
        tool_slug: "betterpic",
        stage: "Headshot",
        status: "optional",
        role: "Generatore di headshot AI",
        note: "Per ottenere un headshot professionale senza shooting. Utile SOLO se non hai già un asset decente.",
        why_chosen:
          "One-shot veloce, qualità sufficiente per LinkedIn, team page, CV.",
        input: "Foto personali di base.",
        output: "Headshot professionale.",
        next_handoff: "L'headshot è usato su LinkedIn, sito, email signature.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "paid",
        limitations:
          "Non sostituisce un shooting vero per esigenze editoriali di alto livello.",
        when_to_skip:
          "Se hai già un headshot professionale: è uno spreco.",
        replacement_trigger: "Se ti serve un look nuovo, è one-shot: paghi, generi, hai finito.",
        alternatives: [],
        order: 4,
      },
      {
        tool_slug: "blogify",
        stage: "Repurposing (opzionale)",
        status: "optional",
        role: "Da LinkedIn a blog post",
        note: "Per trasformare i post LinkedIn più performanti in articoli blog, estendendo la vita utile.",
        why_chosen:
          "Massimizza il ROI dei post che funzionano. Trasforma un singolo post in un articolo SEO.",
        input: "URL del post LinkedIn, trascrizione.",
        output: "Blog post SEO-ready.",
        next_handoff: "L'articolo è pubblicato e linkato dal post LinkedIn.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "L'articolo generato va riletto e personalizzato: Blogify velocizza, non sostituisce.",
        when_to_skip:
          "Se non vuoi/blog non è un canale per te.",
        replacement_trigger: "Se il blog diventa un canale principale, valuta Content Marketing Stack.",
        alternatives: [],
        order: 5,
      },
      {
        tool_slug: "windsor-ai",
        stage: "Misurazione (opzionale)",
        status: "optional",
        role: "Attribuzione e dati marketing",
        note: "Per misurare quale contenuto porta traffico al sito o conversioni. Utile sopra i 1000 follower.",
        why_chosen:
          "Quando LinkedIn inizia a essere un canale di lead, serve misurare.",
        input: "Dati LinkedIn, dati sito, dati CRM.",
        output: "Dashboard attribution, ROI per post.",
        next_handoff: "Le decisioni editoriali sono guidate dai dati.",
        manual_handoff: true,
        learning_curve: "high",
        pricing_relevance: "paid",
        limitations:
          "Richiede setup iniziale e integrazione con sito/CRM.",
        when_to_skip:
          "Sotto i 1000 follower o se non hai un sito/CRM da collegare.",
        replacement_trigger: "Se la complessità cresce, valuta un data warehouse vero.",
        alternatives: [],
        order: 6,
      },
      {
        tool_slug: "jenni-ai",
        stage: "Posizionamento (alternativa)",
        status: "alternative",
        role: "Alternativa a Frase per scrittura long-form",
        note: "Sostituisce Frase AI quando il personal brand produce long-form (articoli, ebook) e non solo post LinkedIn.",
        why_chosen:
          "Migliore su testi lunghi, citazioni, documenti strutturati.",
        input: "Tema, fonti, claim.",
        output: "Documento con citazioni.",
        next_handoff: "Sostituisce Frase nello stesso stage.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non ha l'analisi SERP di Frase: meno SEO-driven.",
        when_to_skip:
          "Se il focus è solo LinkedIn e non vuoi authority SEO.",
        replacement_trigger: "Torna a Frase quando il focus diventa SEO.",
        alternatives: ["frase-ai"],
        order: 7,
      },
    ],
    created_at: "2026-08-10T09:00:00.000Z",
    updated_at: "2026-08-10T09:00:00.000Z",
    first_published_at: "2026-08-10T09:00:00.000Z",
    published_at: "2026-08-10T09:00:00.000Z",
    source_kind: "content",
  },

  // ===== Phase 4 — 4 new Collections (Step 5) =====
  // 9. AI VIDEO TRAINING / COURSE STACK
  {
    id: "collection-video-training",
    slug: "ai-video-training-stack",
    title: "Stack AI per video-corsi e formazione",
    description:
      "Trasformare expertise verticale in un prodotto formativo strutturato: research, script didattici, avatar video, hosting e monetizzazione. Una raccolta operativa per consulenti, formatori e team L&D che vogliono pubblicare un video-corso senza gestire uno studio di produzione.",
    cover_image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Formazione strutturata",
    rationale:
      "La differenza tra un tutorial YouTube e un video-corso monetizzato è la struttura didattica, la coerenza visiva, e la pipeline di pagamento. Qui trovi una sequenza stretta che copre il ciclo completo: Jenni AI per la scaletta, Synthesia per l'avatar, Vidau per il video editing quando serve, Blogify come piattaforma di pubblicazione, e Lemon Squeezy per i pagamenti. Esplicito su quando NON è lo strumento giusto: contenuto one-off, certificazioni accreditate, o training compliance-driven.",
    highlights: [
      "Sequenza completa: ricerca → script → avatar video → hosting → pagamenti",
      "Avatar AI Synthesia per produzione video scalabile in 50+ lingue",
      "Lemon Squeezy come merchant of record per gestire VAT internazionale",
      "Esplicito sui limiti: non sostituisce un LMS vero con quiz e certificati",
    ],
    theme: "video-training",
    audience: "Course creators",
    difficulty: "growing",
    tone: "editorial-picks",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    stack_meta: {
      concise_promise:
        "Trasformare conoscenza specifica in un video-corso monetizzabile, con avatar AI, hosting e pagamenti integrati.",
      job_to_be_done:
        "Costruire e distribuire un prodotto formativo strutturato (video-corso, training interno, paid community) a partire da expertise personale o di team.",
      user_stage:
        "Consulenti, formatori, founder con expertise verticale, team L&D aziendali.",
      last_verified: "2026-08-10",
      setup_time: "2-3 settimane per la variante CORE; 1 mese per FULL.",
      monthly_cost_band: "€30-100",
      difficulty_label:
        "Intermedio — richiede capacità di scrittura didattica e produzione contenuti.",
      related_guide_slugs: ["jenny-ai", "lemon-squeezy"],
      related_collection_slugs: [
        "creator-video-stack",
        "personal-brand-linkedin-stack",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Tre tool: ricerca/script, video avatar AI, piattaforma blog con embed. Minimo per pubblicare un primo modulo.",
        core_tool_slugs: ["jenni-ai", "synthesia-ai", "blogify"],
        gains: [
          "Time-to-publish rapido (settimane, non mesi)",
          "Nessuna infrastruttura tecnica da gestire",
        ],
        trade_offs: [
          "Avatar AI limitato in gesti/espressioni rispetto a produzione reale",
          "Blogify come hosting non ha tutte le feature di una piattaforma LMS dedicata",
        ],
      },
      {
        label: "balanced",
        description:
          "Cinque tool: aggiunge Vidau per video editing e Lemon Squeezy per pagamenti. Corso completo con checkout.",
        core_tool_slugs: [
          "jenni-ai",
          "synthesia-ai",
          "vidau",
          "blogify",
          "lemon-squeezy",
        ],
        gains: [
          "Pagamenti integrati (no Stripe manuale)",
          "Video editing per moduli misti avatar + screen recording",
        ],
        trade_offs: [
          "Più tool da orchestrare: richiede una pipeline chiara",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "Synthesia abbatte la barriera di produzione video: zero camera, zero studio, output coerente in 50+ lingue.",
      weakest:
        "Il course delivery via Blogify è funzionale ma non specializzato: mancano quiz, progress tracking, certificazioni.",
      fragility:
        "Dipendenza forte dalla qualità dello script iniziale: se Jenni AI non produce una scaletta didattica solida, l'intero corso ne risente.",
      vendor_lock_in:
        "Medio: i video Synthesia sono ospitati sui loro server, Blogify ha un lock-in di piattaforma simile.",
      data_privacy:
        "I dati degli studenti passano per Blogify e Lemon Squeezy: se il corso è su IP sensibile, considera self-hosting.",
      scalability:
        "Fino a qualche centinaio di studenti. Oltre, servono piattaforme LMS vere (Teachable, Thinkific) o self-hosted.",
    },
    anti_recommendation: {
      not_for:
        "Creator che fanno video tutorial one-off senza struttura di corso (meglio Creator Video Stack). Non adatto a chi ha bisogno di certificazioni accreditate o compliance formativa (LMS dedicato obbligatorio).",
      look_instead_at: [
        "creator-video-stack",
        "ai-content-marketing-stack",
      ],
    },
    scenario: {
      title: "Consulente marketing che lancia un corso paid per SMB",
      body:
        "Un consulente marketing con 10 anni di esperienza decide di monetizzare la propria expertise. Usa Jenni AI per strutturare 8 moduli partendo dai suoi framework interni. Synthesia produce le video-lezioni con avatar AI partendo dagli script Jenni. Vidau assembla moduli misti (avatar + screen recording di tool). Blogify ospita il corso con pagine di vendita e lesson embeds. Lemon Squeezy gestisce i pagamenti una tantum. Tempo totale: 3 settimane. Primo mese: 40 studenti.",
    },
    included_tools: [
      {
        tool_slug: "jenni-ai",
        stage: "Ricerca e script",
        status: "core",
        role: "Strutturazione didattica e script moduli",
        note: "Per trasformare expertise sparsa in una scaletta didattica solida, con claim, fonti e struttura per modulo.",
        why_chosen:
          "Eccellente su testi lunghi strutturati: produce scalette modulari con citazioni, ideale per course outline.",
        input: "Tema del corso, expertise esistente, claim chiave.",
        output: "Scaletta didattica per modulo, claim con fonti, esercizi.",
        next_handoff: "Lo script passa a Synthesia (avatar video) o Vidau (screen recording).",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non genera video: solo testi. Serve poi Synthesia o produzione manuale.",
        when_to_skip:
          "Se hai già un course outline dettagliato o usi un LMS che genera outline.",
        replacement_trigger: "Se il corso diventa molto long-form, valuta un editor dedicato come Notion o Google Docs.",
        alternatives: ["frase-ai"],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "synthesia-ai",
        stage: "Produzione video",
        status: "core",
        role: "Avatar AI per video-lezioni",
        note: "Per produrre video-lezioni con avatar AI in 50+ lingue, senza camera né studio. Il riferimento per course production scalabile.",
        why_chosen:
          "Massima qualità avatar AI sul mercato, multi-lingua, lip-sync naturale. Tempi di produzione: ore, non settimane.",
        input: "Script di modulo, lingua target, avatar scelto.",
        output: "Video-lezione MP4 pronta per hosting.",
        next_handoff: "Il video si embedda in Blogify o si carica su YouTube come teaser.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "paid",
        limitations:
          "Avatar AI ancora distinguibile da umano in scene emotive. Gesti limitati.",
        when_to_skip:
          "Se il corso richiede presenza umana reale (es. terapia, coaching one-to-one).",
        replacement_trigger:
          "Se serve editing video avanzato, valuta Vidau per scene ibride avatar + screen recording.",
        alternatives: ["vidau"],
        featured: true,
        order: 2,
      },
      {
        tool_slug: "blogify",
        stage: "Hosting e delivery",
        status: "core",
        role: "Piattaforma di pubblicazione corso",
        note: "Per ospitare il corso con pagine di vendita, embed video, e un minimo di content management. Alternativa leggera a Teachable/Thinkific.",
        why_chosen:
          "Buon rapporto qualità/prezzo per chi parte. Auto-publish, markdown export, multiple connected sites.",
        input: "Moduli video finiti, copy di vendita, prezzi.",
        output: "Corso pubblicato con pagine di vendita attive.",
        next_handoff: "I pagamenti arrivano via Lemon Squeezy, embed nel corso Blogify.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Non è un LMS vero: mancano quiz, progress tracking, certificati, discussioni strutturate.",
        when_to_skip:
          "Se ti servono quiz, certificazioni, o compliance formativa aziendale.",
        replacement_trigger:
          "Quando il corso supera 100 studenti o servono funzionalità LMS avanzate, valuta Teachable o self-hosted Moodle.",
        alternatives: ["notionapps"],
        featured: false,
        order: 3,
      },
      {
        tool_slug: "vidau",
        stage: "Editing video (balanced)",
        status: "optional",
        role: "Video editing per moduli misti",
        note: "Per moduli che mescolano avatar Synthesia con screen recording, demo, B-roll. Non serve per la variante LEAN.",
        why_chosen:
          "Buon compromesso qualità/prezzo per editor video AI-assisted. Supporta text-to-video e clip generation.",
        input: "Clip avatar Synthesia, screen recording, asset visivi.",
        output: "Modulo video finale montato.",
        next_handoff: "Il modulo montato si carica su Blogify.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Meno potente di editor professionali (Premiere, Final Cut) per course production avanzata.",
        when_to_skip:
          "Se tutti i moduli sono solo avatar AI senza scene miste.",
        replacement_trigger:
          "Se il corso richiede editing cinematografico, valuta un editor dedicato.",
        alternatives: ["vibrantsnap"],
        featured: false,
        order: 4,
      },
      {
        tool_slug: "lemon-squeezy",
        stage: "Monetizzazione",
        status: "optional",
        role: "Pagamenti e fatturazione del corso",
        note: "Per gestire i pagamenti del corso (one-time o subscription) senza Stripe manuale. Merchant of record, gestisce la compliance fiscale.",
        why_chosen:
          "Merchant of record: meno burocrazia fiscale (VAT, sales tax). Setup in pochi minuti.",
        input: "Prodotto corso, prezzi, URL Blogify.",
        output: "Checkout attivo, link di pagamento integrabili.",
        next_handoff: "I soldi arrivano su Lemon Squeezy, payout periodico.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Commissioni più alte di Stripe puro (sopra soglie di fatturato conviene Stripe).",
        when_to_skip:
          "Se la fatturazione è gestita da un commercialista esterno che preferisce Stripe diretto.",
        replacement_trigger: "Se fatturi > 100k/anno, valuta Stripe diretto per risparmiare fee.",
        alternatives: ["tolt"],
        featured: false,
        order: 5,
      },
      {
        tool_slug: "imagine-art",
        stage: "Visual course assets",
        status: "alternative",
        role: "Generazione immagini per slide e asset corso",
        note: "Per generare immagini di copertina, slide illustrative, banner promozionali del corso.",
        why_chosen:
          "100 free tokens/giorno per test. Buona qualità output. Utile per asset grafici senza graphic designer.",
        input: "Prompt descrittivo di un asset visivo.",
        output: "Immagine generata in vari stili.",
        next_handoff: "Le immagini si integrano in Blogify o nei materiali promozionali.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Free tier limitato a 100 tokens/giorno con watermark. Basic $7-15/mese per uso continuativo.",
        when_to_skip:
          "Se hai un graphic designer o stock photo sufficiente.",
        replacement_trigger:
          "Se serve generazione video o asset 3D, valuta Muse AI.",
        alternatives: ["muse-ai"],
        featured: false,
        order: 6,
      },
    ],
    created_at: "2026-08-10T18:30:00.000Z",
    updated_at: "2026-08-10T18:30:00.000Z",
    first_published_at: "2026-08-10T18:30:00.000Z",
    published_at: "2026-08-10T18:30:00.000Z",
    source_kind: "content",
  },

  // 10. AGENCY OPERATING STACK
  {
    id: "collection-agency-operating",
    slug: "agency-operating-stack",
    title: "Stack operativo per agenzie digitali 2-8 persone",
    description:
      "Gestire il ciclo completo di una micro-agenzia (2-8 persone) senza processi aziendali soffocanti: acquisizione prospect, proposta commerciale, delivery, fatturazione ricorrente, supporto clienti. Una raccolta operativa per founder di agenzie digitali, AI o growth che servono clienti multipli con poco overhead.",
    cover_image_url:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Operatività agenzia",
    rationale:
      "Una micro-agenzia non ha bisogno di Salesforce, Asana enterprise, o tool di project management complessi. Ha bisogno di outreach che porta appuntamenti, automation che elimina il lavoro ripetitivo, fatturazione che non crea burocrazia, e un helpdesk per non perdere i clienti. Qui trovi ReachifyMe per l'acquisizione, Make per l'automation, Lemon Squeezy per la fatturazione, HelpDesk per il supporto, e tool opzionali per capacity aggiuntiva. Esplicito sui limiti: non scala a 30+ clienti senza strumenti enterprise.",
    highlights: [
      "Pipeline outreach → proposta → onboarding completamente automatizzabile",
      "Lemon Squeezy come merchant of record per fatturazione EU+US",
      "HelpDesk + ChatBot per triage automatico h24",
      "Esplicito sui limiti: fino a 15-20 clienti attivi, poi servono tool enterprise",
    ],
    theme: "agency-operating",
    audience: "Agency operators",
    difficulty: "growing",
    tone: "focused-bundle",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    stack_meta: {
      concise_promise:
        "Operare una piccola agenzia (2-8 persone) con un minimo di tooling, senza processi aziendali soffocanti.",
      job_to_be_done:
        "Gestire contemporaneamente più clienti con ciclo completo: acquisizione, proposta, delivery, fatturazione, supporto.",
      user_stage:
        "Founder di agenzie digitali, AI, growth, marketing automation. Team tra 2 e 8 persone.",
      last_verified: "2026-08-10",
      setup_time: "1-2 settimane per setup operativo completo.",
      monthly_cost_band: "€30-100",
      difficulty_label:
        "Intermedio — richiede disciplina di processo, ma tooling è no-code-friendly.",
      related_guide_slugs: ["reachifyme", "lemon-squeezy", "tolt"],
      related_collection_slugs: [
        "lead-generation-stack",
        "ai-customer-support-stack",
        "ai-stack-solo-founders",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Quattro tool: outreach, content engine, automation, billing. Il minimo per partire senza caos.",
        core_tool_slugs: ["reachifyme", "make", "lemon-squeezy", "helpdesk"],
        gains: [
          "Setup in 1 settimana",
          "Costo contenuto per cliente acquisito",
        ],
        trade_offs: [
          "Nessun content engine dedicato: outreach più ripetitivo",
          "Helpdesk base, no AI chatbot integrato",
        ],
      },
      {
        label: "balanced",
        description:
          "Sei tool: aggiunge Frase AI per content engine e ChatBot per triage automatico. Più capacità per cliente.",
        core_tool_slugs: [
          "reachifyme",
          "frase-ai",
          "make",
          "lemon-squeezy",
          "helpdesk",
          "chatbot",
        ],
        gains: [
          "Content engine per outreach personalizzato ad alto volume",
          "Triage automatico richieste clienti via AI chatbot",
        ],
        trade_offs: [
          "Più tool da gestire e integrare tra loro",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "ReachifyMe + Make insieme automatizzano l'intero ciclo outreach → proposta → onboarding, eliminando ore di lavoro manuale.",
      weakest:
        "Helpdesk è funzionale ma non specializzato per agenzie: manca una visione 'per cliente' con SLA e metriche aggregate.",
      fragility:
        "La pipeline Make è il punto critico: se un'azione cambia signature API, l'automazione si rompe silenziosamente.",
      vendor_lock_in:
        "Medio: ogni tool è sostituibile, ma le automazioni Make richiedono tempo per essere migrate.",
      data_privacy:
        "I dati dei clienti dell'agenzia passano per Helpdesk, ChatBot, Make: serve un DPA chiaro e accessi segregati.",
      scalability:
        "Fino a 15-20 clienti attivi. Oltre, servono sistemi con project management dedicato (Notion, Linear, Asana).",
    },
    anti_recommendation: {
      not_for:
        "Agenzie con 1 sola persona (meglio AI Stack Solo Founders). Non adatto a chi fa solo project-based senza delivery ricorrente (manca la retention).",
      look_instead_at: [
        "ai-stack-solo-founders",
        "lead-generation-stack",
      ],
    },
    scenario: {
      title: "Agenzia marketing 4 persone che scala da 5 a 12 clienti",
      body:
        "Una micro-agenzia di 4 persone ha 5 clienti attivi e vuole arrivare a 12 senza aumentare il team. ReachifyMe identifica 30 nuovi prospect a settimana con criteri specifici. Frase AI genera 4 varianti di outreach personalizzate. Make invia le email, monitora le risposte, e quando un prospect risponde positivamente crea automaticamente un'opportunità su Helpdesk. Lemon Squeezy gestisce fatturazione ricorrente mensile per i retainer. ChatBot risponde alle FAQ iniziali dei nuovi clienti h24. In 3 mesi, 12 clienti attivi con lo stesso team.",
    },
    included_tools: [
      {
        tool_slug: "reachifyme",
        stage: "Acquisizione",
        status: "core",
        role: "Prospect e outreach automatizzato",
        note: "Per identificare prospect qualificati e gestire campagne outreach multi-canale. Il motore di acquisizione dell'agenzia.",
        why_chosen:
          "Combina lead generation + outreach automation in un'unica piattaforma. Riduce il tempo da prospect a prima risposta del 60%.",
        input: "Criteri ICP, lista prospect, template messaggi.",
        output: "Prospect qualificati, conversazioni avviate, appuntamenti.",
        next_handoff: "I prospect qualificati passano a Helpdesk (CRM) o ChatBot (triage).",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Richiede template di outreach di qualità: lo strumento amplifica, non genera copy.",
        when_to_skip:
          "Se l'agenzia lavora solo su referral e non ha bisogno di outreach attivo.",
        replacement_trigger:
          "Se serve lead generation più profonda (intent data, technographics), valuta Socleads.",
        alternatives: ["socleads"],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "make",
        stage: "Automation",
        status: "core",
        role: "Orchestrazione tra tool e workflow",
        note: "Per connettere ReachifyMe, Helpdesk, ChatBot, Lemon Squeezy. Il collante operativo dell'agenzia.",
        why_chosen:
          "Visuale, flessibile, supporta 1000+ integrazioni. Riferimento per automazioni multi-tool no-code.",
        input: "Trigger da un tool, condizioni, azioni su altri tool.",
        output: "Flussi automatizzati che girano h24 senza intervento umano.",
        next_handoff: "I dati fluiscono al tool successivo nella pipeline.",
        manual_handoff: true,
        learning_curve: "high",
        pricing_relevance: "paid",
        limitations:
          "Ha costo per operazione: pipeline inefficienti possono diventare care.",
        when_to_skip:
          "Se l'agenzia ha solo 2-3 clienti e i flussi manuali sono gestibili.",
        replacement_trigger:
          "Se i flussi superano le decine di migliaia di operazioni/mese, valuta n8n self-hosted.",
        alternatives: ["n8n"],
        featured: true,
        order: 2,
      },
      {
        tool_slug: "lemon-squeezy",
        stage: "Fatturazione",
        status: "core",
        role: "Pagamenti, fatturazione, retention",
        note: "Per gestire pagamenti ricorrenti (retainer) e one-time con merchant of record. Meno burocrazia fiscale.",
        why_chosen:
          "Merchant of record: gestisce VAT, sales tax internazionale, fatturazione. Perfetto per agenzie con clienti EU+US.",
        input: "Cliente, piano retainer, frequenza fatturazione.",
        output: "Pagamenti automatici, fatture emesse, payout periodici.",
        next_handoff: "I dati di pagamento alimentano il reporting dell'agenzia.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Commissioni più alte di Stripe puro. Oltre 100k/anno conviene Stripe diretto.",
        when_to_skip:
          "Se l'agenzia ha un commercialista che preferisce Stripe + Fatture in Cloud.",
        replacement_trigger: "Se fatturi > 100k/anno, valuta Stripe diretto per risparmiare fee.",
        alternatives: ["tolt"],
        featured: false,
        order: 3,
      },
      {
        tool_slug: "helpdesk",
        stage: "Supporto e CRM",
        status: "core",
        role: "Ticketing, knowledge base, gestione richieste clienti",
        note: "Per gestire tutte le richieste dei clienti in un unico posto, con SLA, priorità, storico conversazioni.",
        why_chosen:
          "Buon rapporto funzionalità/prezzo per team piccoli. Supporta multiple mailbox, automazioni di routing, knowledge base interna.",
        input: "Email clienti, richieste via form, ticket da ChatBot.",
        output: "Ticket assegnati, risolti, con SLA rispettati.",
        next_handoff: "I ticket risolti alimentano la knowledge base per il prossimo cliente.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "freemium",
        limitations:
          "Non è un CRM vero: per gestione pipeline commerciale serve un tool dedicato o Notion custom.",
        when_to_skip:
          "Se i clienti sono < 5 e la comunicazione via email è sufficiente.",
        replacement_trigger:
          "Se servono SLA enforcement, metriche di soddisfazione, o integrazione con project management.",
        alternatives: ["livechat"],
        featured: false,
        order: 4,
      },
      {
        tool_slug: "frase-ai",
        stage: "Content engine (balanced)",
        status: "optional",
        role: "Content engine per outreach personalizzato",
        note: "Per generare varianti di outreach basate su SERP analysis dei prospect, più rilevanti dei template generici.",
        why_chosen:
          "Analisi SERP + AI writing: ogni messaggio di outreach può riferirsi a contenuti reali del prospect.",
        input: "URL prospect, brief del servizio offerto, tono desiderato.",
        output: "Varianti email/LinkedIn personalizzate.",
        next_handoff: "Le varianti passano a Make per invio automatizzato via ReachifyMe.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "paid",
        limitations:
          "Richiede brief chiari: se la value proposition dell'agenzia non è definita, l'output è generico.",
        when_to_skip:
          "Se l'agenzia fa outreach solo su nicchie verticali molto specifiche dove bastano 2-3 template.",
        replacement_trigger:
          "Se serve content engine anche per blog/SEO, Frase è già il riferimento.",
        alternatives: ["jenni-ai"],
        featured: false,
        order: 5,
      },
      {
        tool_slug: "chatbot",
        stage: "Triage clienti (balanced)",
        status: "optional",
        role: "AI chatbot per triage iniziale richieste clienti",
        note: "Per rispondere h24 alle FAQ dei clienti nuovi (onboarding, prezzi, deliverable) e instradare i casi complessi al team.",
        why_chosen:
          "Triage automatico riduce del 40% il tempo del team su richieste ripetitive. Integrazione nativa con Helpdesk.",
        input: "Knowledge base del servizio, FAQ, regole di routing.",
        output: "Risposte automatiche, ticket instradati al membro del team giusto.",
        next_handoff: "I ticket complessi vanno a Helpdesk, le risposte semplici chiudono il loop.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Richiede training iniziale su knowledge base reali: con docs vaghi, l'output è frustrante per il cliente.",
        when_to_skip:
          "Se l'agenzia fa solo 2-3 clienti grandi con communication manager dedicato.",
        replacement_trigger:
          "Se i volumi superano 100 ticket/mese o servono flussi conversazionali complessi.",
        alternatives: ["livechat"],
        featured: false,
        order: 6,
      },
    ],
    created_at: "2026-08-10T18:30:00.000Z",
    updated_at: "2026-08-10T18:30:00.000Z",
    first_published_at: "2026-08-10T18:30:00.000Z",
    published_at: "2026-08-10T18:30:00.000Z",
    source_kind: "content",
  },

  // 11. FREE / BUDGET AI STACK
  {
    id: "collection-free-budget",
    slug: "free-budget-ai-stack",
    title: "Stack AI a basso costo (€0 o quasi)",
    description:
      "Costruire un workflow AI produttivo spendendo €0 o sotto €30/mese, combinando open-source e free tier genuine. Una raccolta per indie hacker, founder early stage, studenti e professionisti che vogliono sperimentare AI senza budget per abbonamenti premium.",
    cover_image_url:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "AI a basso costo",
    rationale:
      "Esistono due percorsi reali: il PATH €0 puro (solo open-source e free tier genuine, accettando limiti di volumi) e il PATH LOW-COST (free tier + entry-level sotto €30/mese totali per capacità più ampia). Qui trovi Flowise come unico tool genuinamente self-hosted del catalogo, Imagine Art per il free tier daily, e tool freemium verificati su pricing 2026. Esplicito sui limiti: i free tier cambiano pricing, i watermark bloccano l'uso commerciale, e i volumi si saturano rapidamente.",
    highlights: [
      "Due percorsi distinti: €0 puro (self-hosted) vs LOW-COST (freemium)",
      "Flowise come unica opzione open-source del catalogo TooolVibes",
      "Pricing verificato su fonti primarie agosto 2026",
      "Esplicito sui limiti: non per uso commerciale ad alto volume",
    ],
    theme: "free-budget",
    audience: "Indie hackers",
    difficulty: "starter",
    tone: "starter-stack",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    stack_meta: {
      concise_promise:
        "Un workflow AI utile davvero spendendo €0 o sotto €30/mese, con tool open-source e free tier verificati.",
      job_to_be_done:
        "Costruire un sistema AI produttivo per task reali (content, immagini, automation) senza pagare abbonamenti premium, partendo da tool con free tier genuine o open-source.",
      user_stage:
        "Indie hacker, founder early stage, studenti, professionisti che vogliono sperimentare AI senza budget.",
      last_verified: "2026-08-10",
      setup_time:
        "Mezza giornata per il PATH €0; 1-2 giorni per il PATH LOW-COST con tool freemium.",
      monthly_cost_band: "€0",
      difficulty_label:
        "Starter per il PATH €0 (richiede self-hosting base). Intermedio per il PATH LOW-COST.",
      related_guide_slugs: ["flowise-ai", "jenny-ai"],
      related_collection_slugs: [
        "ai-stack-solo-founders",
        "ai-content-marketing-stack",
        "ai-video-training-stack",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "PATH €0 puro: solo open-source e free tier genuine. Richiede self-hosting per Flowise, accetta limiti di volumi.",
        core_tool_slugs: ["flowise", "imagine-art"],
        gains: [
          "Costo mensile €0 effettivo (solo costo hosting per Flowise)",
          "Nessun lock-in: tutti i tool sono sostituibili",
        ],
        trade_offs: [
          "Self-hosting Flowise richiede competenze Docker/base",
          "Imagine Art free tier limitato a 100 tokens/giorno con watermark",
        ],
      },
      {
        label: "balanced",
        description:
          "PATH LOW-COST: aggiunge tool freemium sotto €30/mese totale per capacità più ampia.",
        core_tool_slugs: ["flowise", "imagine-art", "jenni-ai", "frase-ai"],
        gains: [
          "Capacità content + immagini + agent AI sotto €30/mese totali",
          "Workflow completo end-to-end: ricerca → scrittura → visuali → agent",
        ],
        trade_offs: [
          "Limiti di volumi mensili da gestire attentamente",
          "Alcuni tool hanno watermark o limiti qualità su free tier",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "Flowise open-source dà pieno controllo sugli agent AI senza dipendere da piattaforme chiuse. Costo effettivo solo hosting (VPS da €5/mese).",
      weakest:
        "I free tier di Imagine Art, Frase, Jenni hanno limiti severi di volumi: per uso continuativo serve almeno un piano entry.",
      fragility:
        "I free tier cambiano pricing senza preavviso: questo stack va ri-verificato ogni 3-6 mesi. Non costruire business critici solo su free tier.",
      vendor_lock_in:
        "Basso. Flowise è self-hosted, gli altri sono freemium. Tutto sostituibile.",
      data_privacy:
        "Ottimo per Flowise (self-hosted = tuo). Attenzione agli altri free tier: i prompt possono essere usati per training.",
      scalability:
        "PATH €0 regge uso individuale (1-2 persone). Per team > 3, i free tier si saturano rapidamente.",
    },
    anti_recommendation: {
      not_for:
        "Team in crescita che hanno bisogno di volumi production (i free tier si saturano in giorni). Non adatto a uso commerciale ad alto volume (i watermark e i limiti sono bloccanti).",
      look_instead_at: [
        "ai-stack-solo-founders",
        "ai-content-marketing-stack",
      ],
    },
    scenario: {
      title: "Indie hacker che costruisce un SaaS in stealth mode",
      body:
        "Un indie hacker in fase stealth vuole costruire una landing, generare contenuti, e prototipare un agent AI per il suo futuro prodotto, tutto a costo zero. Flowise self-hosted su un VPS Hetzner da €5/mese costruisce l'agent che parla con la knowledge base. Imagine Art free tier genera le immagini per la landing. Jenni AI free tier scrive la copy. Frase AI free trial di 7 giorni fa l'analisi SERP. Totale: €5/mese di hosting, 2 weekend di lavoro, MVP validabile con 10 utenti pilota.",
    },
    included_tools: [
      {
        tool_slug: "flowise",
        stage: "Agent AI (self-hosted)",
        status: "core",
        role: "Agent AI open-source self-hosted",
        note: "Per costruire agent AI e RAG con LangChain senza dipendere da piattaforme chiuse. Self-hosted su un VPS o in locale.",
        why_chosen:
          "Open-source, MIT-like license. Unico tool del catalogo TooolVibes che è genuinamente self-hosted e free.",
        input: "Knowledge base, LangChain components, documenti da indicizzare.",
        output: "Agent AI attivi, API esposte, flussi RAG.",
        next_handoff: "Gli agent si integrano via API in qualsiasi sistema.",
        manual_handoff: true,
        learning_curve: "high",
        pricing_relevance: "free",
        limitations:
          "Richiede Docker/VPS e competenze DevOps base. Non è chiavi-in-mano.",
        when_to_skip:
          "Se non hai competenze tecniche o tempo per il setup iniziale.",
        replacement_trigger: "Se serve no-code agent, valuta AgentX (managed, pagato).",
        alternatives: ["agentx"],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "imagine-art",
        stage: "Generazione immagini (€0)",
        status: "core",
        role: "Generazione immagini AI con free tier",
        note: "Free tier genuine: 100 tokens al giorno, watermark su output. Basic $7-15/mese per uso continuativo.",
        why_chosen:
          "Uno dei pochi generatori immagini AI con free tier daily (non solo trial). Buona qualità output per uso non commerciale.",
        input: "Prompt testuale, stile desiderato.",
        output: "Immagine AI in vari formati.",
        next_handoff: "Le immagini si usano in landing, social, blog.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Free tier: 100 tokens/giorno, watermark, no commercial license. Basic $7-15/mese per uso commerciale.",
        when_to_skip:
          "Se ti serve uso commerciale o volumi alti (> 50 immagini/mese).",
        replacement_trigger:
          "Se serve qualità superiore o specifiche commerciali, valuta Midjourney o DALL-E.",
        alternatives: ["muse-ai"],
        featured: false,
        order: 2,
      },
      {
        tool_slug: "jenni-ai",
        stage: "Content writing (low-cost)",
        status: "optional",
        role: "Content writing AI con free tier",
        note: "Free tier per uso occasionale. Buon compromesso qualità/prezzo per content marketing early-stage.",
        why_chosen:
          "Free tier utilizzabile, non solo trial. Buona qualità su testi strutturati e brief.",
        input: "Tema, fonti, claim chiave.",
        output: "Documento strutturato con citazioni.",
        next_handoff: "Il testo passa a Frase per analisi SERP, o direttamente alla pubblicazione.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Free tier limitato a ~10.000 parole/mese. Oltre serve piano a pagamento.",
        when_to_skip:
          "Se il tuo content output supera le 10k parole/mese.",
        replacement_trigger:
          "Se serve analisi SERP, valuta Frase AI (free trial 7 giorni).",
        alternatives: ["frase-ai"],
        featured: false,
        order: 3,
      },
      {
        tool_slug: "frase-ai",
        stage: "SEO content (low-cost)",
        status: "optional",
        role: "Analisi SERP e content SEO con free trial",
        note: "Free trial di 7 giorni, poi piano base $15/mese. Tra i migliori per content SEO-driven.",
        why_chosen:
          "Trial utilizzabile per progetti one-off. Dopo, il piano base è tra i più economici per qualità SERP analysis.",
        input: "Query target, articolo esistente, brief.",
        output: "Brief SEO-driven, ottimizzazioni suggerite, schema competitor.",
        next_handoff: "Il brief passa a Jenni AI o a un editor per la scrittura finale.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Free trial solo 7 giorni. Piano base limitato a 1 utente.",
        when_to_skip:
          "Se il content SEO non è il tuo focus primario.",
        replacement_trigger: "Se serve content engine per team, valuta SurferSEO o MarketMuse.",
        alternatives: ["jenni-ai"],
        featured: false,
        order: 4,
      },
    ],
    created_at: "2026-08-10T18:30:00.000Z",
    updated_at: "2026-08-10T18:30:00.000Z",
    first_published_at: "2026-08-10T18:30:00.000Z",
    published_at: "2026-08-10T18:30:00.000Z",
    source_kind: "content",
  },

  // 12. LEAD GENERATION STACK
  {
    id: "collection-lead-generation",
    slug: "lead-generation-stack",
    title: "Stack AI per lead generation e sales",
    description:
      "Costruire un funnel di lead generation ripetibile per SaaS B2B e agenzie: identificare prospect con criteri ICP, fare outreach multi-canale personalizzato, qualificare le risposte, passare i lead caldi al sales. Una raccolta operativa per founder B2B, sales lead, growth marketer.",
    cover_image_url:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80",
    cover_kicker: "Lead generation B2B",
    rationale:
      "Il gap principale nel catalogo TooolVibes è l'assenza di un CRM dedicato: per ora i lead qualificati vanno gestiti in Notion, Sheets, o tool esterni. Qui trovi Socleads per il lead mining, ReachifyMe per l'outreach, Frase AI per il content engine, Make per l'automation, e ChatBot per la qualification h24. Esplicito sui limiti: non sostituisce un SDR team per sales cycle lunghi, e non copre B2C ad alto volume con paid ads.",
    highlights: [
      "Pipeline completa: prospect → outreach → qualifica → handoff al sales",
      "Socleads per lead mining B2B con criteri ICP granulari",
      "ReachifyMe per outreach multi-canale (email + LinkedIn)",
      "Esplicito sui gap: nessun CRM integrato nel catalogo, documentato come catalog gap",
    ],
    theme: "lead-generation",
    audience: "Sales and growth teams",
    difficulty: "growing",
    tone: "focused-bundle",
    access: "open",
    editorial_state: "published",
    surface: "collection",
    stack_meta: {
      concise_promise:
        "Generare lead qualificati in modo ripetibile, con prospect research, outreach personalizzato, e handoff al sales.",
      job_to_be_done:
        "Costruire un funnel di lead generation ripetibile: identificare ICP-fit, fare outreach multi-canale, qualificare le risposte, passare i lead al sales.",
      user_stage:
        "Founder B2B, sales lead, growth marketer, agenzie con offerta recurring.",
      last_verified: "2026-08-10",
      setup_time:
        "1-2 settimane per setup pipeline completa. 1 mese per iterazione su messaggi e criteri ICP.",
      monthly_cost_band: "€30-100",
      difficulty_label:
        "Intermedio — richiede chiarezza su ICP e capacità di scrivere copy di outreach efficace.",
      related_guide_slugs: ["reachifyme", "frase-ai", "windsor-ai"],
      related_collection_slugs: [
        "agency-operating-stack",
        "ai-customer-support-stack",
        "ai-content-marketing-stack",
      ],
    },
    stack_variants: [
      {
        label: "lean",
        description:
          "Tre tool: lead mining, outreach, content engine. Minimo per partire senza CRM pesante.",
        core_tool_slugs: ["socleads", "reachifyme", "frase-ai"],
        gains: [
          "Setup in 1 settimana",
          "Costo contenuto rispetto a tool enterprise",
        ],
        trade_offs: [
          "Nessun CRM integrato: i lead qualificati vanno gestiti in Notion/Sheets",
          "Nessuna automazione di follow-up multi-step avanzata",
        ],
      },
      {
        label: "balanced",
        description:
          "Cinque tool: aggiunge Make per follow-up automation e ChatBot per qualification h24. Pipeline più robusta.",
        core_tool_slugs: [
          "socleads",
          "reachifyme",
          "frase-ai",
          "make",
          "chatbot",
        ],
        gains: [
          "Follow-up automatico multi-step (no lead dimenticato)",
          "Qualification 24/7 via chatbot (no lead perso di notte)",
        ],
        trade_offs: [
          "Più tool da orchestrare, richiede una Make pipeline manutenuta",
        ],
      },
    ],
    decision_intelligence: {
      strongest:
        "Socleads + ReachifyMe insieme coprono l'intero ciclo: da lead mining a outreach multi-canale automatizzato.",
      weakest:
        "TooolVibes non ha ancora un CRM dedicato: il gap va colmato con Notion, Sheets, o tool esterni. Documentato come catalog gap.",
      fragility:
        "I criteri ICP vanno raffinati continuamente: se Socleads pesca lead fuori target, l'intera pipeline è sprecata.",
      vendor_lock_in:
        "Medio-basso. Socleads e ReachifyMe hanno lock-in di piattaforma ma i dati sono esportabili.",
      data_privacy:
        "I dati prospect passano per Socleads e ReachifyMe: serve conformità GDPR con DPO se market EU.",
      scalability:
        "Fino a 500-1000 prospect/mese. Oltre, serve un SDR team o un tool enterprise (Apollo, Lemlist).",
    },
    anti_recommendation: {
      not_for:
        "B2C ad alto volume con lead generation via paid ads (manca la Meta/Google Ads integration). Non adatto a prodotti con sales cycle > 6 mesi enterprise (serve SDR umano + tool dedicati come Outreach/Salesloft).",
      look_instead_at: [
        "agency-operating-stack",
        "ai-content-marketing-stack",
      ],
    },
    scenario: {
      title: "SaaS B2B early-stage che passa da 0 a 30 demo/mese",
      body:
        "Un SaaS B2B in early stage ha 5 clienti e vuole arrivare a 30 demo qualificate al mese. Socleads identifica 200 prospect/settimana con criteri ICP (settore, dimensione, tech stack). ReachifyMe gestisce outreach multi-canale (email + LinkedIn) con 4 varianti di messaggio. Frase AI genera i messaggi personalizzati basandosi sull'analisi SERP dei prospect. Make automatizza i follow-up: chi non risponde in 5 giorni riceve un reminder; chi apre ma non risponde riceve una variante diversa. ChatBot qualifica i click al sito h24. In 3 mesi: 30 demo/mese, 8 chiusure/mese.",
    },
    included_tools: [
      {
        tool_slug: "socleads",
        stage: "Lead mining",
        status: "core",
        role: "Identificazione prospect qualificati (lead mining)",
        note: "Per estrarre prospect con criteri specifici (settore, dimensione, tech stack, seniority) da fonti pubbliche e database B2B.",
        why_chosen:
          "Specializzato in B2B lead mining. Filtri granulari, esportazione in CSV, integrazione con i principali outreach tool.",
        input: "Criteri ICP (industria, ruolo, azienda), paese target.",
        output: "Lista prospect con email verificate, ruolo, azienda.",
        next_handoff: "I prospect passano a ReachifyMe per la campagna outreach.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Qualità dei dati variabile per paese/settore: serve validazione e test continui.",
        when_to_skip:
          "Se il target è troppo di nicchia (< 1000 aziende totali) o troppo vasto (richiede CRM dedicato).",
        replacement_trigger:
          "Se servono enrichment dati più profondi (intent, technographics), valuta Apollo o ZoomInfo.",
        alternatives: ["reachifyme"],
        featured: true,
        order: 1,
      },
      {
        tool_slug: "reachifyme",
        stage: "Outreach automation",
        status: "core",
        role: "Outreach multi-canale automatizzato",
        note: "Per inviare email + LinkedIn outreach su larga scala, con personalizzazione, follow-up, e tracking risposte.",
        why_chosen:
          "Combina email + LinkedIn in un'unica piattaforma. Sequenze multi-step, A/B test messaggi, report su open/click/risposte.",
        input: "Lista prospect da Socleads, template messaggi, sequenze follow-up.",
        output: "Risposte, appuntamenti, lead qualificati.",
        next_handoff: "I lead qualificati passano al sales (o a ChatBot per qualification automatica).",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Richiede template di qualità: copy debole = basso response rate. Non è magic.",
        when_to_skip:
          "Se il volume è < 100 prospect/mese (overhead non giustificato).",
        replacement_trigger: "Se serve SDR scale (10k+ prospect/mese), valuta Apollo o Outreach.",
        alternatives: ["socleads"],
        featured: true,
        order: 2,
      },
      {
        tool_slug: "frase-ai",
        stage: "Content engine",
        status: "core",
        role: "Generazione copy outreach personalizzato",
        note: "Per generare varianti di messaggi outreach basate su analisi SERP e contenuti reali del prospect.",
        why_chosen:
          "Analisi SERP + AI: ogni messaggio può riferirsi a contenuti recenti del prospect, alzando il response rate.",
        input: "URL prospect, brief del servizio, tono desiderato.",
        output: "Varianti email/LinkedIn personalizzate.",
        next_handoff: "Le varianti si caricano in ReachifyMe come template della campagna.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "paid",
        limitations:
          "Richiede brief chiari: se la value proposition non è definita, l'output è generico.",
        when_to_skip:
          "Se fai outreach solo su 1 nicchia verticale con 2-3 template sempre uguali.",
        replacement_trigger:
          "Se serve anche content engine per blog/SEO, Frase è già il riferimento.",
        alternatives: ["jenni-ai"],
        featured: false,
        order: 3,
      },
      {
        tool_slug: "make",
        stage: "Automation (balanced)",
        status: "optional",
        role: "Automazione follow-up e routing lead",
        note: "Per orchestrare i follow-up multi-step, instradare i lead qualificati al sales, e sincronizzare i tool tra loro.",
        why_chosen:
          "Flessibilità totale, supporta 1000+ integrazioni, perfetto per pipeline custom B2B.",
        input: "Eventi da ReachifyMe, trigger da form, condizioni di routing.",
        output: "Follow-up automatici, lead instradati al sales, dati sincronizzati.",
        next_handoff: "I lead arrivano al sales team con tutte le info contestualizzate.",
        manual_handoff: true,
        learning_curve: "high",
        pricing_relevance: "paid",
        limitations:
          "Ha costo per operazione: pipeline inefficienti diventano care rapidamente.",
        when_to_skip:
          "Se il volume è basso e i follow-up manuali sono gestibili.",
        replacement_trigger:
          "Se le operazioni superano decine di migliaia/mese, valuta n8n self-hosted.",
        alternatives: ["n8n"],
        featured: false,
        order: 4,
      },
      {
        tool_slug: "chatbot",
        stage: "Qualification h24 (balanced)",
        status: "optional",
        role: "AI chatbot per qualification automatica dei lead",
        note: "Per qualificare i lead h24 quando arrivano via form o cliccano ads. Riduce il lead response time da ore a secondi.",
        why_chosen:
          "Triage automatico con AI: chiede budget, timeline, decision-making power. Passa al sales solo i lead qualificati.",
        input: "Knowledge base del servizio, criteri di qualifica (BANT-like).",
        output: "Lead qualificati instradati al sales, lead freddi inseriti in nurturing.",
        next_handoff: "I lead qualificati vanno al sales, i freddi in nurture sequence via Make.",
        manual_handoff: true,
        learning_curve: "low",
        pricing_relevance: "freemium",
        limitations:
          "Richiede training iniziale su criteri di qualifica chiari. Se i criteri sono vaghi, l'output è inutile.",
        when_to_skip:
          "Se il lead volume è < 50/mese (un sales rep può gestirli manualmente).",
        replacement_trigger:
          "Se i volumi superano 200 lead/mese o servono flussi conversazionali complessi.",
        alternatives: ["livechat"],
        featured: false,
        order: 5,
      },
      {
        tool_slug: "windsor-ai",
        stage: "Attribution (optional)",
        status: "alternative",
        role: "Attribution multi-canale per misurare il ROI della lead gen",
        note: "Per misurare quali canali portano lead qualificati e chiusure, oltre il last-click di Google Analytics.",
        why_chosen:
          "Collega i dati da Meta Ads, Google Ads, LinkedIn Ads, organico in un'unica dashboard. Supporta il calcolo del ROI reale.",
        input: "Account ads collegati, eventi di conversione, definizione lead qualificato.",
        output: "Dashboard attribution, ROI per canale, customer journey visualizzato.",
        next_handoff: "I dati alimentano le decisioni di budget allocation per il mese successivo.",
        manual_handoff: true,
        learning_curve: "medium",
        pricing_relevance: "paid",
        limitations:
          "Richiede setup attento dei pixel e conversion event: setup sbagliato = dati sbagliati.",
        when_to_skip:
          "Se il budget ads è < €1k/mese (overhead non giustificato).",
        replacement_trigger: "Se serve attribution cross-device, valuta TripleWhale o Northbeam.",
        alternatives: [],
        featured: false,
        order: 6,
      },
    ],
    created_at: "2026-08-10T18:30:00.000Z",
    updated_at: "2026-08-10T18:30:00.000Z",
    first_published_at: "2026-08-10T18:30:00.000Z",
    published_at: "2026-08-10T18:30:00.000Z",
    source_kind: "content",
  },
];
