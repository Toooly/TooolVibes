// BATCH 29: le liste locali `nav`/`footerNav` (stale e non più usate) sono
// state rimosse: la configurazione IA canonica vive in `lib/navigation/`.
export const marketingStrings = {
  hero: {
    eyebrow: "Sistema editoriale italiano",
    title: "Il posto dove i tool AI smettono di essere rumore e diventano scelta.",
    description:
      "TooolVibes non prova a mostrarti tutto: seleziona i segnali giusti, ordina le alternative e ti aiuta a costruire una scelta più lucida.",
    primaryCta: "Entra nel catalogo",
    secondaryCta: "Apri il radar",
  },
  weekly: {
    title: "Radar vivo della settimana",
    description:
      "Pochi tool appena emersi o tornati rilevanti. Non i più rumorosi: quelli che oggi meritano davvero un test.",
  },
  archive: {
    title: "Il catalogo dove la ricerca diventa decisione.",
    description:
      "Cerca, filtra e stringi il campo con pochi passaggi. Qui entri per trovare il prossimo tool da provare, non per perderti tra pagine promozionali.",
    searchLabel: "Ricerca",
    searchPlaceholder: "Cerca nome, tag o caso d'uso",
    categoryLabel: "Categoria",
    sortLabel: "Ordina per",
    allCategories: "Tutte le categorie",
    emptyTitle: "Nessun Toool trovato",
    emptyDescription:
      "Prova a cambiare filtro oppure usa un termine più ampio.",
  },
  tags: {
    title: "Tag operativi",
    description:
      "Una mappa rapida per attraversare il catalogo per casi d'uso, famiglie funzionali e affinità di prodotto.",
  },
  shop: {
    title: "Premium",
    description:
      "Risorse e percorsi premium per trasformare la scoperta in scelte più rapide, test più ordinati e materiali pronti all'uso.",
    cta: "Vai allo shop esterno",
  },
  detail: {
    website: "Visita il sito",
    article: "Apri il post TooolVibes",
    discovered: "Scoperto il",
    source: "Fonte",
    category: "Categoria",
    tags: "Tag",
  },
  admin: {
    title: "Area editoriale interna",
    description:
      "Area riservata per aggiornare catalogo, contenuti e flusso editoriale.",
    loginTitle: "Accesso interno",
    loginDescription:
      "Inserisci la password riservata per entrare nella dashboard editoriale.",
  },
} as const;
