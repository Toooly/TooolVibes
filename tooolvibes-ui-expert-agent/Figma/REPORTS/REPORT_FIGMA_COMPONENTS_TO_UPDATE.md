# REPORT FIGMA — Componenti da Aggiornare

> **Agent:** figma_handoff_specialist  
> **Modalità:** ANALISI → REPORT → HANDOFF FIGMA ONLY  

---

## Premessa

I file sorgente non descrivono componenti Figma esistenti. Il progetto TooolVibes ha spedito codice **senza un sistema Figma-first**. Pertanto, questo report non elenca "aggiornamenti a componenti Figma esistenti", ma definisce l'**allineamento necessario tra componenti di codice esistenti e future primitive Figma-SoT**.

Per ogni componente codice presunto, si indica cosa dovrà essere creato in Figma ex-novo e quali rischi di incoerenza emergono dal fatto che il codice esiste ma la Figma-SoT no.

---

## Componente: Button (codice esistente)
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Buttons  
**Stato attuale:** Esiste in codice (`components/ui/Button.tsx` presumibile).  
**Cosa aggiornare in Figma (ex-novo):** Tutte le varianti (primary, secondary, ghost, destructive, icon-only) in 3 size (sm, md, lg) e 6 stati (default, hover, focus, active, disabled, loading).  
**Rischio incoerenza codice/Figma:** **ALTA** — il componente esiste in codice ma non in Figma-SoT. Ogni nuova variante aggiunta in codice senza Figma rischia di divergere.  
**Allineamento necessario:**
- Mappare ogni prop React (`variant`, `size`, `loading`, `disabled`) a una variante Figma.
- Verificare che i colori usati in codice (es. Tailwind classes) mappino 1:1 ai token proposti (`color/accent/primary`, etc.).
- Se il codice usa nomi Tailwind non semantici (es. `bg-violet-600`), segnalare `HANDOFF → design_system_architect` per migration.
**Priorità:** P0  
**Note operative per Figma:**
- Creare il componente Figma-SoT come spec esatta del codice attuale, poi iterare.
- Documentare nel report `REPORT_FIGMA_COMPONENTS_TO_CREATE.md`.

---

## Componente: Badge (codice esistente)
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Badges  
**Stato attuale:** Esiste in codice.  
**Cosa aggiornare in Figma (ex-novo):** Varianti neutral/accent/success/warning/danger/info con token binding.  
**Rischio incoerenza codice/Figma:** **ALTA** — badge spesso creati ad-hoc in codice con classi arbitrarie.  
**Allineamento necessario:**
- Verificare che ogni badge nel codice usi uno dei 6 varianti standard.
- Se esistono badge con colori custom, classificarli come Figma-Reference o migrarli alla variante standard.
**Priorità:** P0  
**Note operative per Figma:**
- Raccogliere tutte le occorrenze badge nel codice per mapparle alle varianti.

---

## Componente: Card / Tool Card (codice esistente)
**Categoria:** composite  
**Sezione progetto:** 02 — Components / Tool Card  
**Stato attuale:** Esiste in codice, è il workhorse dell'app.  
**Cosa aggiornare in Figma (ex-novo):** Layout verticale mobile, layout orizzontale desktop, stati hover/selected/loading.  
**Rischio incoerenza codice/Figma:** **ALTA** — la card è usata in molte rotte; ogni variazione di padding, radius o spaziatura in codice deve essere catturata.  
**Allineamento necessario:**
- Verificare se il codice ha già un componente Card riutilizzabile o se esistono molteplici implementazioni.
- Se esistono più implementazioni, pianificare unification prima del binding Figma.
- Catturare il comportamento responsive (grid collapse) come annotazione, non come variante statica.
**Priorità:** P0  
**Note operative per Figma:**
- Costruire la Figma-SoT a partire dall'implementazione più usata, non da zero.

---

## Componente: Input / Search (codice esistente)
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Inputs  
**Stato attuale:** Esiste in codice.  
**Cosa aggiornare in Figma (ex-novo):** Varianti text/search/textarea/select/checkbox/radio/switch con stati completi.  
**Rischio incoerenza codice/Figma:** **MEDIO-ALTA** — input spesso stilati con utility classes Tailwind sparse.  
**Allineamento necessario:**
- Audit di tutti gli input nel codice per verificare coerenza di padding, border, radius, focus style.
- Se il focus ring nel codice differisce dal token `color/focus/ring`, segnalare.
**Priorità:** P0  
**Note operative per Figma:**
- Prestare attenzione allo stato search: spesso ha stili diversi dagli altri input.

---

## Componente: Modal (codice esistente)
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Modal  
**Stato attuale:** Esiste in codice (modal confronto, modal auth).  
**Cosa aggiornare in Figma (ex-novo):** Varianti default/large/confirmation/form con header/body/footer strutturato.  
**Rischio incoerenza codice/Figma:** **MEDIO** — modali spesso one-off, ma il componente base dovrebbe essere riutilizzabile.  
**Allineamento necessario:**
- Verificare se esiste un componente Modal riutilizzabile o se ogni modale è custom.
- Catturare max-width e padding da codice.
**Priorità:** P0  
**Note operative per Figma:**
- Annotare z-index e backdrop nel codice (Code-Only, ma visivamente rappresentato).

---

## Componente: Toast (codice esistente)
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Toast  
**Stato attuale:** Esiste in codice (feedback salvataggi, errori).  
**Cosa aggiornare in Figma (ex-novo):** Varianti success/error/warning/info.  
**Rischio incoerenza codice/Figma:** **MEDIO** — toast spesso gestiti da libreria esterna (es. Sonner, React-Toastify) con stili propri.  
**Allineamento necessario:**
- Se il toast usa una libreria, verificare se i colori sono override-abilai per mappare ai token.
- Se non override-abili, classificare come Figma-Reference e documentare.
**Priorità:** P1  
**Note operative per Figma:**
- Non animare entrance/exit in Figma; annotare posizione e durata.

---

## Componente: Tabs (codice esistente)
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Tabs  
**Stato attuale:** Esiste in codice (Tool Detail, forse altre pagine).  
**Cosa aggiornare in Figma (ex-novo):** Varianti default/pills/underline con stati active/hover/disabled.  
**Rischio incoerenza codice/Figma:** **MEDIO** — tabs spesso implementati con libreria headless (Radix, etc.).  
**Allineamento necessario:**
- Verificare se lo stile dei tabs in codice è consistente tra le pagine.
- Catturare indicator active (underline o pill) come token binding.
**Priorità:** P1  
**Note operative per Figma:**
- Mobile: annotare scroll orizzontale se i tab eccedono lo viewport.

---

## Componente: Avatar (codice esistente)
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Avatar  
**Stato attuale:** Esiste in codice (autore, utente).  
**Cosa aggiornare in Figma (ex-novo):** Varianti image/fallback in 3 size.  
**Rischio incoerenza codice/Figma:** **BASSO** — avatar semplice, basso rischio di drift.  
**Allineamento necessario:**
- Verificare size usate nel codice (16/24/32/48?).
- Verificare se esiste bordo stato (online/verificato).
**Priorità:** P1  
**Note operative per Figma:**
- Creare fallback con iniziali maiuscole.

---

## Componente: BottomSheet (codice esistente)
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Modal / Sheet  
**Stato attuale:** Esiste in codice (filtri mobile, azioni).  
**Cosa aggiornare in Figma (ex-novo):** Varianti default/expanded/peek con handle drag.  
**Rischio incoerenza codice/Figma:** **MEDIO** — bottom sheet spesso nativo-mobile o libreria specifica.  
**Allineamento necessario:**
- Verificare se il codice usa una libreria (es. Vaul, Radix Dialog) con stili propri.
- Mappare altezze peek/expanded da codice.
**Priorità:** P1  
**Note operative per Figma:**
- Rappresentare solo struttura visiva; animazioni = Code-Only.

---

## Componente: Tooltip (codice esistente)
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Tooltip  
**Stato attuale:** Esiste in codice.  
**Cosa aggiornare in Figma (ex-novo):** Varianti posizionali top/bottom/left/right.  
**Rischio incoerenza codice/Figma:** **MEDIO** — tooltip spesso da libreria headless (Radix) con stili override-abili.  
**Allineamento necessario:**
- Verificare se i tooltip nel codice usano token di colore o valori hardcoded.
**Priorità:** P1  
**Note operative per Figma:**
- Non rappresentare delay; annotare che il trigger è hover/focus.

---

## Componente: Accordion (codice esistente)
**Categoria:** primitive  
**Sezione progetto:** 01 — Primitives / Accordion  
**Stato attuale:** Potrebbe esistere in codice (FAQ, dettagli).  
**Cosa aggiornare in Figma (ex-novo):** Varianti default/bordered/filled con stati collapsed/expanded.  
**Rischio incoerenza codice/Figma:** **BASSO** — uso parsimonioso, basso impatto di drift.  
**Allineamento necessario:**
- Verificare se esistono implementazioni multiple.
**Priorità:** P2  
**Note operative per Figma:**
- Usare parsimoniosamente; preferire Tabs per navigazione principale.

---

## Componente: Header / Nav (codice esistente)
**Categoria:** composite  
**Sezione progetto:** 02 — Components / Header  
**Stato attuale:** Esiste in codice.  
**Cosa aggiornare in Figma (ex-novo):** Varianti default/scrolled/mobile/auth con stati completi.  
**Rischio incoerenza codice/Figma:** **ALTA** — header tocca molte rotte e stati (auth, scroll, mobile).  
**Allineamento necessario:**
- Verificare comportamento scroll (quando diventa sticky/elevated).
- Verificare contenuto nav per utente loggato vs anonimo.
**Priorità:** P0  
**Note operative per Figma:**
- Mobile: rappresentare sia hamburger chiuso che aperto.

---

## Componente: Footer (codice esistente)
**Categoria:** composite  
**Sezione progetto:** 02 — Components / Footer  
**Stato attuale:** Esiste in codice.  
**Cosa aggiornare in Figma (ex-novo):** Varianti default/minimal.  
**Rischio incoerenza codice/Figma:** **MEDIO** — footer meno soggetto a cambiamenti frequenti.  
**Allineamento necessario:**
- Verificare link presenti e sezione newsletter.
- Verificare placement affiliate disclosure.
**Priorità:** P1  
**Note operative per Figma:**
- Annotare link legali obbligatori.

---

## Riepilogo Allineamento

| Componente | Rischio incoerenza | Priorità | Stato Figma |
|-----------|-------------------|----------|-------------|
| Button | Alta | P0 | Da creare ex-novo |
| Badge | Alta | P0 | Da creare ex-novo |
| Tool Card | Alta | P0 | Da creare ex-novo |
| Input | Medio-Alta | P0 | Da creare ex-novo |
| Modal | Medio | P0 | Da creare ex-novo |
| Toast | Medio | P1 | Da creare ex-novo |
| Tabs | Medio | P1 | Da creare ex-novo |
| Avatar | Basso | P1 | Da creare ex-novo |
| BottomSheet | Medio | P1 | Da creare ex-novo |
| Tooltip | Medio | P1 | Da creare ex-novo |
| Accordion | Basso | P2 | Da creare ex-novo |
| Header/Nav | Alta | P0 | Da creare ex-novo |
| Footer | Medio | P1 | Da creare ex-novo |

---

**RICHIESTA NON APPLICATA — documentata solo per handoff Figma. Nessuna modifica codice eseguita.**

---

*Fine del report componenti da aggiornare.*
