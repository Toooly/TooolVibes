import type { CuratedCollection } from "@/lib/types/collection";

// Display copy is separate from the source, cost bands and workflow definitions.
const previews: Record<string, { sourceTitle: string; title: string; description: string }> = {
  "ai-stack-solo-founders": {
    "sourceTitle": "Stack AI per founder solo",
    "title": "Stack AI per founder indipendenti",
    "description": "Organizza ricerca, sito e MVP con ruoli distinti e alternative per non sovrapporre gli strumenti."
  },
  "design-sprint-essentials": {
    "sourceTitle": "Essenziali per design sprint",
    "title": "Il kit per un design sprint",
    "description": "Passa dalla direzione visiva al prototipo e a una landing pronta da condividere."
  },
  "creator-video-stack": {
    "sourceTitle": "Stack creator per video e voce",
    "title": "Video e voce, dall’idea alla pubblicazione",
    "description": "Coordina scrittura, immagini, video e parlato; riutilizza il risultato anche per il blog."
  },
  "ai-content-marketing-stack": {
    "sourceTitle": "Stack AI per content marketing",
    "title": "Uno stack per il content marketing",
    "description": "Collega ricerca, scrittura, immagini e distribuzione in un processo editoriale ripetibile."
  },
  "from-mvp-to-sellable-saas": {
    "sourceTitle": "Da MVP a SaaS vendibile",
    "title": "Da MVP a SaaS vendibile",
    "description": "Prepara pagamenti, gestione fiscale, affiliazioni e supporto per vendere un prodotto già funzionante."
  },
  "ai-customer-support-stack": {
    "sourceTitle": "Stack AI per customer support",
    "title": "Uno stack per l’assistenza clienti",
    "description": "Dividi il lavoro tra risposte AI, chat umana e ticket, collegando i passaggi tra strumenti."
  },
  "ai-agents-automation-stack": {
    "sourceTitle": "Stack AI agents e automazione",
    "title": "Agenti AI e automazioni",
    "description": "Confronta un percorso no-code e uno self-hosted per scegliere come costruire il tuo sistema di agenti."
  },
  "personal-brand-linkedin-stack": {
    "sourceTitle": "Stack personal brand su LinkedIn",
    "title": "La tua presenza su LinkedIn",
    "description": "Organizza posizionamento, contenuti, immagini e pubblicazione in una routine sostenibile."
  },
  "ai-video-training-stack": {
    "sourceTitle": "Stack AI per video-corsi e formazione",
    "title": "Video-corsi e formazione con l’AI",
    "description": "Trasforma le tue competenze in un corso, dalla ricerca ai video fino alla distribuzione."
  },
  "agency-operating-stack": {
    "sourceTitle": "Stack operativo per agenzie digitali 2-8 persone",
    "title": "Lo stack per una piccola agenzia",
    "description": "Segui acquisizione, proposte, consegne, fatturazione e supporto senza frammentare il lavoro."
  },
  "free-budget-ai-stack": {
    "sourceTitle": "Stack AI a basso costo (€0 o quasi)",
    "title": "Uno stack AI a basso costo",
    "description": "Combina strumenti open source e piani gratuiti per provare flussi AI prima di investire in abbonamenti."
  },
  "lead-generation-stack": {
    "sourceTitle": "Stack AI per lead generation e sales",
    "title": "Dalla ricerca dei contatti alla vendita",
    "description": "Collega ricerca dei prospect, contatti personalizzati, qualificazione e passaggio al team commerciale."
  }
};

export function getCollectionPreviewCopy(collection: CuratedCollection) {
  const preview = previews[collection.slug];
  return preview?.sourceTitle === collection.title
    ? preview
    : { title: collection.title, description: collection.stack_meta?.concise_promise ?? collection.description };
}
