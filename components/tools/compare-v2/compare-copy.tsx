"use client";
import { useLocale } from "@/components/i18n/locale-provider";
import type { ReactNode } from "react";

const english: Record<string, string> = {
  "Tool da confrontare": "Tools to compare",
  "Scegli il primo tool": "Choose your first tool",
  "Scegli il secondo tool": "Choose your second tool",
  "Tool selezionati": "Selected tools",
  "Scegli due tool per iniziare. Puoi aggiungerne fino a cinque.": "Choose two tools to start. You can add up to five.",
  "Gli altri tool restano nel confronto.": "Your other tools stay in this comparison.",
  "Aggiungi o rimuovi i tool da confrontare.": "Add or remove tools from this comparison.",
  "Rimuovi un tool per aggiungerne un altro.":
    "Remove a tool to add another one.",
  selezionati: "selected",
  "Preparazione del confronto…": "Preparing comparison…",
  "L’obiettivo mette in primo piano i criteri più utili.":
    "Your goal brings the most relevant criteria to the top.",
  "Hai raggiunto il limite di tool.": "You have reached the tool limit.",
  "Confronto chiuso.": "Comparison complete.",
  "Confronta e scegli": "Compare and choose",
  Confronto: "Comparison",
  "Poche differenze. Una scelta più chiara.":
    "Fewer distractions. A clearer choice.",
  "Scegli una coppia, leggi le differenze e decidi cosa provare.":
    "Pick a pair, read the differences and decide what to try.",
  "Prezzi, funzioni e limiti dei tool selezionati.":
    "Pricing, features and limitations of your selected tools.",
  Tool: "Tools",
  Gestisci: "Manage",
  "Tool a confronto": "Tools in this comparison",
  "Leggi un criterio alla volta, per tutti i tool.": "Compare every tool, one criterion at a time.",
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
  "I dati disponibili coincidono per tutti i tool.":
    "The available details are the same for every tool.",
  "Nessun dato documentato per questa sezione.":
    "No documented data for this section.",
  "La tua scelta": "Your decision",
  "Quale vuoi provare?": "Which one will you try?",
  "Scegli un tool e annota perché lo preferisci.":
    "Choose a tool and note why it works for you.",
  Scegli: "Choose",
  "Apri scheda": "View details",
  "Fonte dei prezzi": "Pricing source",
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
  "Scegli dal catalogo o dai tool salvati.":
    "Choose from the catalog or your saved tools.",
  "Apri il catalogo": "Browse the catalog",
  "Vai ai salvati": "View saved tools",
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
  "Per una tabella più breve, attiva “Mostra solo differenze”.":
    "Turn on “Show only differences” for a shorter table.",
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
