"use client";
import { useLocale } from "@/components/i18n/locale-provider";
import type { ReactNode } from "react";

const english: Record<string, string> = {
  "Rimuovi un tool per aggiungerne un altro.":
    "Remove a tool to add another one.",
  selezionati: "selected",
  "Preparazione del confronto…": "Preparing comparison…",
  "La scelta resta tua: l’obiettivo ordina i criteri, senza assegnare un vincitore automatico.":
    "Your choice: the goal prioritises criteria without picking an automatic winner.",
  "Hai raggiunto il limite di tool.": "You have reached the tool limit.",
  "Confronto chiuso.": "Comparison complete.",
  "Confronta e scegli": "Compare and choose",
  Confronto: "Comparison",
  "Poche differenze. Una scelta più chiara.":
    "Fewer distractions. A clearer choice.",
  "Scegli una coppia, leggi le differenze e decidi cosa provare.":
    "Pick a pair, read the differences and decide what to try.",
  "Due–quattro tool, con i dati che servono per decidere.":
    "Two to four tools, with the facts you need to decide.",
  Tool: "Tools",
  "Altro tool…": "Another tool…",
  "Differenze chiave": "Key differences",
  "Gestisci tool": "Manage tools",
  "Aggiungi tool": "Add a tool",
  "Azzera confronto": "Clear comparison",
  "Mostra solo differenze": "Show only differences",
  "In sintesi": "Overview",
  "Prezzi e condizioni": "Pricing and terms",
  "Funzionalità AI": "AI capabilities",
  "Integrazioni e sviluppo": "Integrations and development",
  "Piattaforme e controllo": "Platforms and control",
  "Ideale per": "Best for",
  "Punto di forza": "Strength",
  "Da considerare": "Trade-off",
  "Prezzo di partenza": "Entry price",
  Categoria: "Category",
  "Livello di utilizzo": "Experience level",
  "Piani pubblicati": "Published plans",
  "Condizioni e consumi": "Billing and usage",
  "Funzioni distintive": "Distinctive capabilities",
  Integrazioni: "Integrations",
  Automazioni: "Automation",
  "API e sviluppo": "API and developer tools",
  Piattaforme: "Platforms",
  "Privacy e controllo": "Privacy and control",
  "Open source": "Open source",
  "Non documentato": "Not documented",
  "Differenze da cui partire": "Start with these differences",
  "Nessuna differenza documentata tra questi tool.":
    "No documented differences between these tools.",
  "Stessi valori per i tool selezionati.":
    "The selected tools have the same values.",
  "Nessun dato documentato per questa sezione.":
    "No documented data for this section.",
  "La tua scelta": "Your decision",
  "Quale vuoi provare?": "Which one will you try?",
  "Registra una scelta, senza un vincitore automatico.":
    "Record your choice, without an automatic winner.",
  Scegli: "Choose",
  "Apri scheda": "View details",
  "Fonte prezzi": "Pricing source",
  Sostituisci: "Replace",
  Rimuovi: "Remove",
  Chiudi: "Close",
  "Cerca un tool": "Search for a tool",
  "Nessun tool trovato.": "No tools found.",
  "Già nel confronto": "Already selected",
  "Primo tool": "First tool",
  "Secondo tool": "Second tool",
  "Cambia coppia": "Change pair",
  "Scegli almeno due tool.": "Select at least two tools.",
  "Aggiungili qui oppure riparti dal catalogo o dai salvati.":
    "Add them here, or start from the catalog or your saved tools.",
  "Apri il catalogo": "Browse the catalog",
  "Apri Salvati": "Open Saved",
  Criteri: "Criteria",
  Obiettivo: "Goal",
  "Lettura generale": "General comparison",
  "Risparmiare tempo": "Save time",
  "Aumentare qualità": "Improve quality",
  "Ridurre costi": "Reduce costs",
  "Imparare velocemente": "Learn faster",
  Collaborare: "Collaborate",
  Scalare: "Scale",
  Sperimentare: "Experiment",
  "Confronto pronto": "Comparison ready",
  "Offerta non più attiva": "Offer no longer active",
  "Le informazioni mancanti non indicano una funzionalità assente.":
    "Missing information does not mean a capability is absent.",
  "Leggi il contesto nella scheda completa prima di scegliere.":
    "Read the full context in each tool card before choosing.",
  "Valutazione non disponibile": "Rating unavailable",
  "Tool non disponibili nel catalogo": "Tools unavailable in the catalog",
  "Confronta 2–4 candidati per una lettura più diretta.":
    "Compare 2–4 candidates for a more focused view.",
  "al mese": "per month",
  "per utente al mese": "per user per month",
  "al mese, con fatturazione annuale": "per month, billed annually",
  "Su richiesta": "Contact sales",
  "per transazione": "per transaction",
  "una tantum": "one-time",
};
export function useCompareCopy() {
  const { locale, t } = useLocale();
  return (source: string) =>
    locale === "en" ? (english[source] ?? t(source)) : source;
}
export function CompareText({ children }: { children: string }): ReactNode {
  const t = useCompareCopy();
  return t(children);
}
