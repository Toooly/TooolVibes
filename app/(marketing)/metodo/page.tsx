import type { Metadata } from "next";
import Link from "next/link";
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
import { RouteMarker } from "@/components/ui/route-marker";
import { formatDecisionLifecycle } from "@/lib/product/decision-lifecycle";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Metodo di valutazione dei tool",
  description:
    "Come TooolVibes pensa una scelta: Scopri, Valuta, Confronta, Decidi, Ricorda. Un percorso editoriale con criteri verificabili.",
  path: "/metodo",
  openGraphDescription:
    "Scopri, valuta, confronta, decidi, ricorda — il metodo editoriale di TooolVibes per scegliere tool senza perdersi.",
});

const TRACK_STEPS = [
  {
    index: "01",
    label: "Scopri",
    title: "Parti da quello che devi fare",
    copy: "Obiettivi, catalogo e stack. Nessuna vetrina infinita: restringi i candidati prima di approfondire.",
    href: "/archivio",
    cta: "Apri catalogo",
  },
  {
    index: "02",
    label: "Valuta",
    title: "Leggi se è per te",
    copy: "Ogni scheda deve dire per chi è, per chi no, il trade-off e cosa è stato valutato. Salvare un candidato non è ancora decidere.",
    href: "/archivio",
    cta: "Apri catalogo",
  },
  {
    index: "03",
    label: "Confronta",
    title: "Confronta solo i candidati forti",
    copy: "Porta avanti pochi tool alla volta e guarda differenze e limiti reali. La matrice serve a isolare gli scarti.",
    href: "/compare",
    cta: "Vai al confronto",
  },
  {
    index: "04",
    label: "Decidi",
    title: "Scegli con un motivo",
    copy: "Una decisione è: questo tool, invece di quelli, perché. La shortlist resta il tavolo di lavoro, non il verdetto.",
    href: "/compare",
    cta: "Apri il confronto",
  },
  {
    index: "05",
    label: "Ricorda",
    title: "Conserva il perché",
    copy: "I Salvati tengono candidati, note e scelte. Così la ricerca non ricomincia da zero la volta dopo.",
    href: "/shortlist",
    cta: "Apri salvati",
  },
] as const;

const PRINCIPLES = [
  {
    title: "Decisione, non elenco",
    copy: "Riduciamo la scelta a ciò che è utile adesso: categorie leggibili, filtri che fanno davvero selezione, niente vetrine infinite.",
    icon: <Compass className="size-4" aria-hidden="true" />,
    bullets: [
      "Catalogo verificato, non elenco infinito.",
      "Filtri orientati al contesto, non keyword gonfiate.",
    ],
  },
  {
    title: "Verifica, non sintesi",
    copy: "Ogni scheda deve dire cosa è stato verificato, quando e come. Le informazioni che non reggono un confronto non entrano in TooolVibes.",
    icon: <ShieldCheck className="size-4" aria-hidden="true" />,
    bullets: [
      "Provenienza delle fonti dichiarata.",
      "Limiti del tool espliciti, non nascosti.",
    ],
  },
  {
    title: "Criteri, non metriche",
    copy: "Il nostro verdotto nasce da criteri editoriali, non da punteggi sintetici: il numero non sostituisce il motivo.",
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
      <SecondaryHero
        tone="dark"
        layout="split"
        routeIndex="04"
        routeLabel="Metodo editoriale"
        routeStatus="Come TooolVibes pensa"
        emphasis="cinque tappe"
        title="Una scelta è un percorso, non una lista."
        lede="TooolVibes non è un elenco: è un metodo. Scopri, valuta, confronta, decidi, ricorda. Salvare un candidato non è decidere."
        actions={
          <Link
            href="/archivio"
            className="secondary-card__cta"
            aria-label="Apri il catalogo e inizia la prima tappa"
          >
            <span>Inizia dal catalogo</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
        signature={
          <>
            <span className="secondary-hero__signature-eyebrow">
              <RouteMarker
                index="·"
                label="Sistema a cinque tappe"
                status="Editoriale"
                density="minimal"
              />
            </span>
            <p
              className="secondary-hero__signature-verbs"
              style={{
                margin: 0,
                color: "var(--tv-ink-secondary)",
                fontSize: "0.95rem",
                lineHeight: 1.55,
              }}
            >
              <strong style={{ color: "var(--tv-ink-primary)" }}>
                Scopri
              </strong>{" "}
              restringe,{" "}
              <strong style={{ color: "var(--tv-ink-primary)" }}>Valuta</strong>{" "}
              legge i limiti,{" "}
              <strong style={{ color: "var(--tv-ink-primary)" }}>Confronta</strong>{" "}
              isola,{" "}
              <strong style={{ color: "var(--tv-ink-primary)" }}>Decidi</strong>{" "}
              sceglie,{" "}
              <strong style={{ color: "var(--tv-ink-primary)" }}>Ricorda</strong>{" "}
              tiene il motivo.
            </p>
          </>
        }
      />

      <SecondarySection
        eyebrow="Percorso"
        title={formatDecisionLifecycle()}
        lede="Ogni tappa ha una destinazione reale su TooolVibes: non una descrizione, uno strumento."
      >
        <DecisionTrack steps={TRACK_STEPS} />
      </SecondarySection>

      <SecondarySection
        tone="ivory"
        eyebrow="Principi"
        title="Come pensiamo le valutazioni"
        lede="TooolVibes ragiona come un editor, non come un aggregatore. Tre principi reggono ogni scheda."
      >
        <SecondaryCardGrid columns={3}>
          {PRINCIPLES.map((principle) => (
            <SecondaryPrincipleCard
              key={principle.title}
              title={principle.title}
              copy={principle.copy}
              bullets={principle.bullets}
              icon={principle.icon}
              tone="ivory"
            />
          ))}
        </SecondaryCardGrid>
      </SecondarySection>

      <SecondaryClosingCTA
        tone="dark"
        title="La cosa migliore da fare, adesso."
        body="Parti dal catalogo per restringere i candidati. I Salvati tengono quelli che stai considerando, con il motivo."
        actions={
          <>
            <Link href="/archivio" className="secondary-card__cta secondary-card__cta--ghost method-closing-catalog">
              <span>Apri il catalogo</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/shortlist"
              className="secondary-card__cta secondary-card__cta--ghost"
            >
              <span>Riapri i salvati</span>
            </Link>
          </>
        }
      />
    </SecondaryPageShell>
  );
}
