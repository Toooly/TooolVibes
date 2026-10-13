import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { Metadata } from "next";
import Link from "@/components/ui/app-link";
import { ArrowRight, ArrowUpRight, Compass, FileText, Layers3, Mail } from "lucide-react";

import {
  SecondaryCardGrid,
  SecondaryClosingCTA,
  SecondaryHero,
  SecondaryPageShell,
  SecondaryPrincipleCard,
  SecondarySection,
} from "@/components/secondary";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Studio editoriale",
  description:
    "Servizi di ricerca, sistemi decisionali e contenuti editoriali per prodotti, team e organizzazioni.",
  path: "/studio",
  openGraphDescription:
    "Ricerca, sistemi decisionali e contenuti editoriali per prodotti e team.",
});

const STUDIO_EMAIL = "mailto:hello@tooolvibes.com?subject=Studio%20by%20TooolVibes";

const SERVICES = [
  {
    title: "Ricerca e mappatura",
    copy: "Ricognizioni chiare su strumenti, categorie e opportunità prima di decidere cosa introdurre o cosa sostituire.",
    icon: <Compass className="size-4" aria-hidden="true" />,
    bullets: [
      "Mappatura per categoria e per caso d'uso.",
      "Una sintesi che regge una decisione, non un elenco.",
    ],
  },
  {
    title: "Sistemi decisionali",
    copy: "Criteri, confronti e percorsi per aiutare team e clienti a scegliere con più contesto e meno opinioni.",
    icon: <Layers3 className="size-4" aria-hidden="true" />,
    bullets: [
      "Criteri dichiarati e verificabili.",
      "Confronto side-by-side con limiti evidenti.",
    ],
  },
  {
    title: "Editoriale di prodotto",
    copy: "Guide, pagine e narrative che rendono comprensibili prodotti complessi senza perdere precisione.",
    icon: <FileText className="size-4" aria-hidden="true" />,
    bullets: [
      "Linguaggio adatto al prodotto, non al marketing.",
      "Verifica editoriale delle fonti e delle affermazioni.",
    ],
  },
] as const;

const PROCESS = [
  {
    title: "Prima lettura",
    copy: "Raccontaci il contesto: arriva una prima lettura editoriale del problema, senza impegno.",
  },
  {
    title: "Piano di lavoro",
    copy: "Definiamo formato, scadenze e criteri editoriali. Niente promesse di metriche non verificabili.",
  },
  {
    title: "Consegna",
    copy: "Materiali con revisione interna e approvazione finale. Il documento resta tuo: rilasciato con licenza chiara.",
  },
] as const;

export default function StudioPage() {
  return (
    <SecondaryPageShell>
      <LocalizedAttributes><SecondaryHero
        tone="dark"
        layout="split"
        routeIndex="08"
        routeLabel="Studio by TooolVibes"
        routeStatus="Servizi"
        emphasis="decisioni più chiare"
        title="Diamo forma a decisioni più chiare."
        lede="Studio by TooolVibes collabora con prodotti e team che hanno bisogno di ricerca, struttura e parole precise per orientare persone reali."
        actions={
          <>
            <LocalizedAttributes><a
              href={STUDIO_EMAIL}
              className="secondary-card__cta"
              aria-label="Scrivi a TooolVibes per parlare del progetto"
            >
              <Mail aria-hidden="true" className="size-4" />
              <span><LocalizedText>{"Parla del progetto"}</LocalizedText></span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a></LocalizedAttributes>
            <Link
              href="/archivio"
              className="secondary-card__cta secondary-card__cta--ghost"
            >
              <span><LocalizedText>{"Guarda il catalogo"}</LocalizedText></span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </>
        }
        signature={
          <>
            <span className="secondary-hero__signature-eyebrow">
              <span><LocalizedText>{"Prima lettura gratuita"}</LocalizedText></span>
            </span>
            <p
              style={{
                margin: 0,
                color: "var(--tv-ink-primary)",
                fontFamily: "var(--tv-font-family-ui)",
                fontSize: "1.05rem",
                lineHeight: 1.4,
                fontWeight: 600,
              }}
            ><LocalizedText>{"Raccontaci il contesto, non il budget. "}</LocalizedText></p>
            <p
              style={{
                margin: 0,
                color: "var(--tv-ink-secondary)",
                fontFamily: "var(--tv-font-family-ui)",
                fontSize: "0.9rem",
                lineHeight: 1.55,
              }}
            ><LocalizedText>{"Ti rispondiamo con una prima lettura editoriale del problema, anche quando la risposta è onesta \"non è il nostro perimetro\". "}</LocalizedText></p>
          </>
        }
      /></LocalizedAttributes>

      <LocalizedAttributes><SecondarySection
        eyebrow="Servizi"
        title="Tre servizi, una sola coerenza"
        lede="Interventi essenziali, costruiti intorno a una domanda decisionale concreta. Ogni servizio può essere breve o continuativo."
      >
        <SecondaryCardGrid columns={3}>
          {SERVICES.map((service) => (
            <LocalizedAttributes key={service.title}><SecondaryPrincipleCard
              key={service.title}
              title={service.title}
              copy={service.copy}
              bullets={service.bullets}
              icon={service.icon}
            /></LocalizedAttributes>
          ))}
        </SecondaryCardGrid>
      </SecondarySection></LocalizedAttributes>

      <LocalizedAttributes><SecondarySection
        tone="ivory"
        eyebrow="Processo"
        title="Come lavoriamo"
        lede="Un percorso breve, dichiarato e verificabile. Tre passaggi, senza sorprese in fattura."
      >
        <SecondaryCardGrid columns={3}>
          {PROCESS.map((step) => (
            <LocalizedAttributes key={step.title}><SecondaryPrincipleCard
              key={step.title}
              title={step.title}
              copy={step.copy}
              tone="ivory"
            /></LocalizedAttributes>
          ))}
        </SecondaryCardGrid>
      </SecondarySection></LocalizedAttributes>

      <LocalizedAttributes><SecondaryClosingCTA
        tone="dark"
        title="Hai una decisione difficile da prendere?"
        body="Scrivici. Se è un caso che possiamo indirizzare, rispondiamo con una prima lettura; se non lo è, lo diciamo apertamente."
        actions={
          <>
            <LocalizedAttributes><a
              href={STUDIO_EMAIL}
              className="secondary-card__cta"
              aria-label="Apri la mail per parlare del progetto"
            >
              <Mail aria-hidden="true" className="size-4" />
              <span><LocalizedText>{"Scrivi a hello@tooolvibes.com"}</LocalizedText></span>
            </a></LocalizedAttributes>
            <Link
              href="/archivio"
              className="secondary-card__cta secondary-card__cta--ghost"
            >
              <span><LocalizedText>{"Esplora il catalogo"}</LocalizedText></span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </>
        }
      /></LocalizedAttributes>
    </SecondaryPageShell>
  );
}
