export const marketingStrings = {
  nav: [
    { href: "/archivio", label: "Archivio" },
    { href: "/collections", label: "Collections" },
  ],
  footerNav: [
    { href: "/", label: "Home" },
    { href: "/archivio", label: "Archivio" },
    { href: "/collections", label: "Collections" },
    { href: "/shortlist", label: "Workspace" },
    { href: "/account", label: "Account" },
  ],
  hero: {
    eyebrow: "Sistema editoriale italiano",
    title: "Il posto dove i tool AI smettono di essere rumore e diventano scelta.",
    description:
      "TooolVibes non prova a mostrarti tutto: accende i segnali giusti, ordina le alternative e ti porta verso uno stack più lucido.",
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
      "Cerca, filtra e stringi il campo con pochi passaggi. Qui entri per trovare il prossimo candidato giusto, non per perderti in una landing.",
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
      "Panoramica concreta su preview, member issue e accesso: cosa resta aperto, cosa si sblocca davvero e quando ha senso uscire verso lo shop.",
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
      "Superficie interna per governare catalogo, publish state e flusso editoriale senza passare ogni volta dal codice.",
    loginTitle: "Accesso interno",
    loginDescription:
      "Usa la password configurata in ambiente per entrare nella dashboard editoriale.",
  },
} as const;
