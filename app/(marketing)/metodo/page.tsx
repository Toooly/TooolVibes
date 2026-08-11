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
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Metodo",
  description:
    "Come TooolVibes pensa una scelta: Scopri, Confronta, Salva. Un percorso editoriale in tre tappe con criteri verificabili.",
  path: "/metodo",
  openGraphDescription:
    "Scopri, confronta, salva — il metodo editoriale di TooolVibes per scegliere tool senza perdersi.",
});

const TRACK_STEPS = [
  {
    index: "01",
    label: "Scopri",
    title: "Parti da tool già filtrati",
    copy: "Categorie leggibili, filtri utili e un catalogo verificato che tiene fuori il rumore. Nessuna vetrina infinita.",
    href: "/archivio",
    cta: "Apri catalogo",
  },
  {
    index: "02",
    label: "Confronta",
    title: "Confronta solo i candidati forti",
    copy: "Porta avanti pochi tool alla volta e guarda differenze, livello e casi d'uso reali. La matrice serve a isolare gli scarti.",
    href: "/compare",
    cta: "Vai al confronto",
  },
  {
    index: "03",
    label: "Salva",
    title: "Chiudi con una scelta rapida",
    copy: "Salva, rivedi e trasforma la ricerca in una lista operativa pronta da provare. Dai salvati si passa all'azione.",
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
        emphasis="tre tappe"
        title="Una scelta è un percorso in tre tappe."
        lede="TooolVibes non è un elenco: è un metodo. Scopri, confronta, salva. Le schede si leggono in sequenza, non tutte insieme, e ogni tappa ha uno strumento dedicato."
        actions={
          <>
            <Link
              href="/archivio"
              className="secondary-card__cta"
              aria-label="Apri il catalogo e inizia la prima tappa"
            >
              <span>Inizia dal catalogo</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/radar"
              className="secondary-card__cta secondary-card__cta--ghost"
            >
              <span>Vedi i segnali Radar</span>
            </Link>
          </>
        }
        signature={
          <>
            <span className="secondary-hero__signature-eyebrow">
              <RouteMarker
                index="·"
                label="Sistema a tre tappe"
                status="Editoriale"
                density="minimal"
              />
            </span>
            <p
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
              restringe, <strong style={{ color: "var(--tv-ink-primary)" }}>Confronta</strong>{" "}
              isola, <strong style={{ color: "var(--tv-ink-primary)" }}>Salva</strong>{" "}
              chiude. Nessun passaggio è facoltativo e ognuno ha un tool dedicato.
            </p>
          </>
        }
      />

      <SecondarySection
        eyebrow="Percorso"
        title="Scopri · Confronta · Salva"
        lede="Le tre tappe del percorso editoriale. Ogni tappa ha una destinazione reale su TooolVibes: non una descrizione, uno strumento."
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
        body="Apri uno dei tre strumenti: ognuno ha un compito preciso. Salva i tool che reggono il primo giro di confronto, poi restringi fino a sceglierne uno."
        actions={
          <>
            <Link href="/archivio" className="secondary-card__cta">
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
