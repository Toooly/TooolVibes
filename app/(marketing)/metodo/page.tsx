import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { Metadata } from "next";
import Link from "@/components/ui/app-link";
import { ArrowRight, Compass, Gauge, ShieldCheck } from "lucide-react";

import {
  SecondaryCardGrid,
  SecondaryClosingCTA,
  SecondaryHero,
  SecondaryPageShell,
  SecondaryPrincipleCard,
  SecondarySection,
} from "@/components/secondary";
import { DecisionTrack } from "@/components/method/decision-track";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Metodo di valutazione dei tool",
  description:
    "Cinque passi per scegliere un tool: scopri, valuta, confronta, decidi e ricorda il motivo della scelta.",
  path: "/metodo",
  openGraphDescription:
    "Scopri, valuta, confronta, decidi, ricorda — il metodo editoriale di TooolVibes per scegliere tool senza perdersi.",
});

const TRACK_STEPS = [
  {
    index: "01",
    label: "Scopri",
    title: "Parti da quello che devi fare",
    copy: "Definisci il lavoro da fare e usa categorie e filtri per trovare i primi candidati.",
    href: "/archivio",
    cta: "Apri catalogo",
  },
  {
    index: "02",
    label: "Valuta",
    title: "Capisci se fa per te",
    copy: "Leggi casi d’uso, punti di forza e limiti. Salva i tool che vuoi approfondire.",
    href: "/archivio",
    cta: "Apri catalogo",
  },
  {
    index: "03",
    label: "Confronta",
    title: "Metti a fuoco le differenze",
    copy: "Affianca pochi candidati e confronta ciò che conta per il tuo obiettivo.",
    href: "/compare",
    cta: "Vai al confronto",
  },
  {
    index: "04",
    label: "Decidi",
    title: "Scegli con un motivo",
    copy: "Registra il tool scelto e il motivo. Puoi anche rimandare la decisione o scartare un candidato.",
    href: "/compare",
    cta: "Apri il confronto",
  },
  {
    index: "05",
    label: "Ricorda",
    title: "Conserva il perché",
    copy: "Ritrova candidati, note e decisioni nei Salvati, senza ricominciare la ricerca.",
    href: "/shortlist",
    cta: "Apri salvati",
  },
] as const;

const PRINCIPLES = [
  {
    title: "Partiamo dal tuo obiettivo",
    copy: "Riduciamo la scelta a ciò che è utile adesso: categorie leggibili, filtri che fanno davvero selezione, niente vetrine infinite.",
    icon: <Compass className="size-4" aria-hidden="true" />,
    bullets: [
      "Catalogo verificato, non elenco infinito.",
      "Filtri orientati al contesto, non keyword gonfiate.",
    ],
  },
  {
    title: "Mostriamo fonti e limiti",
    copy: "Ogni scheda deve dire cosa è stato verificato, quando e come. Le informazioni che non reggono un confronto non entrano in TooolVibes.",
    icon: <ShieldCheck className="size-4" aria-hidden="true" />,
    bullets: [
      "Provenienza delle fonti dichiarata.",
      "Limiti del tool espliciti, non nascosti.",
    ],
  },
  {
    title: "Spieghiamo il giudizio",
    copy: "Il punteggio riassume la valutazione. Le motivazioni aiutano a capire se il tool è adatto al tuo lavoro.",
    icon: <Gauge className="size-4" aria-hidden="true" />,
    bullets: [
      "Giudizi editoriali indipendenti.",
      "Confronto side-by-side: pochi candidati, ben confrontati.",
    ],
  },
] as const;

export default function MetodoPage() {
  return (
    <SecondaryPageShell>
      <LocalizedAttributes><SecondaryHero
        tone="dark"
        layout="stack"
        routeIndex="04"
        routeLabel="Metodo editoriale"
        title="Cinque passi per scegliere meglio."
        lede="Parti dal bisogno, valuta le alternative e conserva il motivo della scelta."
        actions={
          <LocalizedAttributes><Link
            href="/archivio"
            className="secondary-card__cta"
            aria-label="Apri il catalogo e inizia la prima tappa"
          >
            <span><LocalizedText>{"Inizia dal catalogo"}</LocalizedText></span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link></LocalizedAttributes>
        }
      /></LocalizedAttributes>

      <LocalizedAttributes><SecondarySection
        title="Dalla ricerca alla scelta."
      >
        <DecisionTrack steps={TRACK_STEPS} />
      </SecondarySection></LocalizedAttributes>

      <LocalizedAttributes><SecondarySection
        tone="ivory"
        eyebrow="Principi"
        title="Come pensiamo le valutazioni"
        lede="Tre principi guidano il modo in cui presentiamo e valutiamo i tool."
      >
        <SecondaryCardGrid columns={3}>
          {PRINCIPLES.map((principle) => (
            <LocalizedAttributes key={principle.title}><SecondaryPrincipleCard
              key={principle.title}
              title={principle.title}
              copy={principle.copy}
              bullets={principle.bullets}
              icon={principle.icon}
              tone="ivory"
            /></LocalizedAttributes>
          ))}
        </SecondaryCardGrid>
      </SecondarySection></LocalizedAttributes>

      <LocalizedAttributes><SecondaryClosingCTA
        tone="dark"
        title="Metti il metodo alla prova."
        body="Apri il catalogo e salva i tool che vuoi valutare."
        actions={
          <>
            <Link href="/archivio" className="secondary-card__cta secondary-card__cta--ghost method-closing-catalog">
              <span><LocalizedText>{"Apri il catalogo"}</LocalizedText></span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/shortlist"
              className="secondary-card__cta secondary-card__cta--ghost"
            >
              <span><LocalizedText>{"Riapri i salvati"}</LocalizedText></span>
            </Link>
          </>
        }
      /></LocalizedAttributes>
    </SecondaryPageShell>
  );
}
