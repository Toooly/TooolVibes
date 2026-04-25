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
    eyebrow: "Directory editoriale italiana",
    title: "L'ingresso per capire quali tool AI e SaaS meritano davvero spazio nel tuo stack.",
    description:
      "TooolVibes non prova a mostrarti tutto. Ti porta dal primo orientamento a una scelta piu` chiara con meno rumore e meno deviazioni.",
    primaryCta: "Apri l'archivio",
    secondaryCta: "Guarda il radar settimanale",
  },
  weekly: {
    title: "RADAR DELLA SETTIMANA",
    description:
      "Pochi tool appena emersi o tornati rilevanti. Non i piu` rumorosi, ma quelli che oggi meritano un passaggio serio.",
  },
  archive: {
    title: "L'archivio dove la ricerca diventa scrematura.",
    description:
      "Cerca, filtra e stringi il campo con pochi passaggi. Qui entri per trovare il prossimo candidato giusto, non per leggere una landing.",
    searchLabel: "Ricerca",
    searchPlaceholder: "Cerca nome, tag o caso d'uso",
    categoryLabel: "Categoria",
    sortLabel: "Ordina per",
    allCategories: "Tutte le categorie",
    emptyTitle: "Nessun Toool trovato",
    emptyDescription:
      "Prova a cambiare filtro oppure usa un termine piu` ampio.",
  },
  tags: {
    title: "Tag editoriali",
    description:
      "Una mappa rapida per attraversare l'archivio per casi d'uso, famiglie funzionali e affinita` di prodotto.",
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
