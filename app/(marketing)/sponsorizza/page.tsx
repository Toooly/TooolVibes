import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  LayoutGrid,
  Mail,
  Sparkles,
  Target,
} from "lucide-react";

import { createPublicPageMetadata } from "@/lib/seo/metadata";
import {
  ALL_SPONSOR_CAMPAIGNS,
  TAYLORA_CAMPAIGN,
} from "@/lib/sponsors/sponsor-placements";

import { SponsorOpportunityMailtoLink } from "@/components/monetization/sponsor-analytics-tracker";
import {
  PartnerCreativeRenderer,
} from "@/components/monetization/partner-creatives";
import { buildPartnerDestinationUrl } from "@/lib/sponsors/partner-resolver";
import { partnerThemeKey } from "@/lib/sponsors/partner-theme";

/** Showcase previews: every currently active direct partner campaign. */
const LIVE_PARTNER_CAMPAIGNS = ALL_SPONSOR_CAMPAIGNS.filter(
  (campaign) => campaign.status === "active",
);

import "@/styles/sponsorizza.css";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Sponsorizza un tool",
  description:
    "Porta il tuo tool davanti a founder, product manager e professionisti che stanno attivamente confrontando tool su TooolVibes. Partner Experience: Spotlight, Catalog Insert, Contextual Experience e Collection Partner.",
  path: "/sponsorizza",
  openGraphDescription:
    "TooolVibes Partner Experience: racconti di prodotto contestuali, indipendenza editoriale, davanti a chi sta già decidendo.",
});

const SPONSOR_EMAIL =
  "mailto:hello@tooolvibes.com?subject=Richiesta%20informazioni%20sponsorship";
const SPONSOR_EMAIL_LABEL = "Richiedi informazioni";

type FormatSlug = "spotlight" | "tool-card" | "dispatch" | "collection";

const formatCards: ReadonlyArray<{
  slug: FormatSlug;
  index: string;
  title: string;
  label: string;
  copy: string;
  bullets: ReadonlyArray<string>;
}> = [
  {
    slug: "spotlight",
    index: "01",
    title: "Spotlight",
    label: "Homepage",
    copy:
      "Un racconto visivo del prodotto, con identità, messaggio e grafica animata dedicati.",
    bullets: [
      "In primo piano sulla homepage.",
      "Grafica costruita intorno al prodotto.",
      "Una sola Spotlight attiva per periodo.",
    ],
  },
  {
    slug: "tool-card",
    index: "02",
    title: "Catalog Insert",
    label: "Catalogo",
    copy:
      "Una scheda sponsorizzata con forma e identità distinte dai tool recensiti.",
    bullets: [
      "Tra le schede organiche, non a fondo pagina.",
      "Contenuto sponsorizzato dichiarato, senza punteggi o classifica.",
      "Grafica e collegamento dedicati al prodotto.",
    ],
  },
  {
    slug: "dispatch",
    index: "03",
    title: "Contextual Experience",
    label: "Guide e articoli",
    copy:
      "Il prodotto raccontato accanto a guide, articoli e raccolte pertinenti.",
    bullets: [
      "Abbinata al tema del contenuto.",
      "Un racconto legato al contesto di lettura.",
      "Disponibile su richiesta per guide e articoli.",
    ],
  },
  {
    slug: "collection",
    index: "04",
    title: "Collection Partner",
    label: "Raccolte tematiche",
    copy:
      "Il brand sostiene una raccolta tematica, senza partecipare alla selezione dei tool.",
    bullets: [
      "Abbinamento basato sui tool inclusi, non su parole chiave generiche.",
      "Nessun intervento su selezione, ordine o giudizi.",
      "Un solo partner per raccolta.",
    ],
  },
];

const processSteps: ReadonlyArray<{ title: string; copy: string }> = [
  {
    title: "Richiedi informazioni",
    copy:
      "Presenta il tool e gli obiettivi della campagna a hello@tooolvibes.com.",
  },
  {
    title: "Valutazione editoriale",
    copy:
      "Verifichiamo che il tool rispetti i criteri editoriali e qualitativi di TooolVibes.",
  },
  {
    title: "Contenuti e grafica",
    copy:
      "Concordiamo formato, testi e collegamenti, con una revisione prima della pubblicazione.",
  },
  {
    title: "Pubblicazione",
    copy:
      "La campagna va online nelle date concordate, con indicazione dello sponsor e controllo della qualità.",
  },
  {
    title: "Risultati",
    copy:
      "A fine campagna ricevi un riepilogo di impression, clic e coinvolgimento.",
  },
];

export default function SponsorizzaPage() {

  return (
    <div className="sponsorizza-page page-shell">
      {/* HERO */}
      <section className="sponsorizza-hero" aria-labelledby="sponsorizza-hero-title">
        <div className="sponsorizza-hero__inner">
          <div className="sponsorizza-hero__copy">
            <span className="sponsorizza-hero__eyebrow"><LocalizedText>{"TooolVibes Partner Experience"}</LocalizedText></span>
            <h1 id="sponsorizza-hero-title" className="sponsorizza-hero__title"><LocalizedText>{"Fatti trovare da chi sta scegliendo un tool. "}</LocalizedText></h1>
            <p className="sponsorizza-hero__subtitle"><LocalizedText>{"Presenta il tuo prodotto nel contesto in cui può essere utile: catalogo, radar o raccolte. Ogni presenza è selezionata e dichiarata come sponsorizzata. "}</LocalizedText></p>
            <SponsorOpportunityMailtoLink
              placementId="sponsor-page-hero"
              route="/sponsorizza"
              href={SPONSOR_EMAIL}
              className="sponsorizza-hero__cta"
            >
              <Mail aria-hidden="true" />
              <span><LocalizedText>{SPONSOR_EMAIL_LABEL}</LocalizedText></span>
              <ArrowRight aria-hidden="true" />
            </SponsorOpportunityMailtoLink>
          </div>

          <LocalizedAttributes><aside className="sponsorizza-hero__visual" aria-label="Dove incontrare il pubblico">
            <div className="sponsorizza-hero__visual-row">
              <span className="sponsorizza-hero__visual-marker" aria-hidden="true">
                <Target />
              </span>
              <span>
                <strong><LocalizedText>{"Founder e responsabili di prodotto"}</LocalizedText></strong>
                <span><LocalizedText>{"Scelgono i tool da usare nel proprio lavoro."}</LocalizedText></span>
              </span>
            </div>
            <div className="sponsorizza-hero__visual-row">
              <span className="sponsorizza-hero__visual-marker" aria-hidden="true">
                <LayoutGrid />
              </span>
              <span>
                <strong><LocalizedText>{"Catalogo e Radar"}</LocalizedText></strong>
                <span><LocalizedText>{"Strumenti da esplorare e nuovi lanci da valutare."}</LocalizedText></span>
              </span>
            </div>
            <div className="sponsorizza-hero__visual-row">
              <span className="sponsorizza-hero__visual-marker" aria-hidden="true">
                <BookOpenText />
              </span>
              <span>
                <strong><LocalizedText>{"Guide editoriali"}</LocalizedText></strong>
                <span><LocalizedText>{"Approfondimenti su tool e flussi di lavoro."}</LocalizedText></span>
              </span>
            </div>
          </aside></LocalizedAttributes>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="sponsorizza-section" aria-labelledby="sponsorizza-audience-title">
        <header className="sponsorizza-section__header">
          <h2 id="sponsorizza-audience-title" className="sponsorizza-section__title"><LocalizedText>{"Chi raggiungi "}</LocalizedText></h2>
          <p className="sponsorizza-section__lead"><LocalizedText>{"Founder, responsabili di prodotto e professionisti alla ricerca di strumenti per un lavoro concreto."}</LocalizedText></p>
        </header>

        <div className="sponsorizza-audience">
          <div className="sponsorizza-audience__copy">
            <p><LocalizedText>{"C’è chi cerca un primo stack, chi verifica un’idea di prodotto e chi vuole sostituire un tool. La campagna si inserisce in questa fase di valutazione."}</LocalizedText></p>
          </div>

          <LocalizedAttributes><div className="sponsorizza-audience__visual" aria-label="Percorsi di scelta">
            <div className="sponsorizza-audience__visual-row">
              <span className="dot" aria-hidden="true" />
              <span>
                <strong><LocalizedText>{"Ricerca attiva nel catalogo"}</LocalizedText></strong>
                <span><LocalizedText>{"Categorie, filtri e tool salvati."}</LocalizedText></span>
              </span>
            </div>
            <div className="sponsorizza-audience__visual-row is-violet">
              <span className="dot" aria-hidden="true" />
              <span>
                <strong><LocalizedText>{"Confronto tra tool"}</LocalizedText></strong>
                <span><LocalizedText>{"Caratteristiche e differenze, nello stesso spazio."}</LocalizedText></span>
              </span>
            </div>
            <div className="sponsorizza-audience__visual-row is-warm">
              <span className="dot" aria-hidden="true" />
              <span>
                <strong><LocalizedText>{"Novità dal Radar"}</LocalizedText></strong>
                <span><LocalizedText>{"Lanci, voti e commenti da Product Hunt."}</LocalizedText></span>
              </span>
            </div>
            <div className="sponsorizza-audience__visual-row">
              <span className="dot" aria-hidden="true" />
              <span>
                <strong><LocalizedText>{"Lettura editoriale"}</LocalizedText></strong>
                <span><LocalizedText>{"Guide pratiche e raccolte tematiche."}</LocalizedText></span>
              </span>
            </div>
          </div></LocalizedAttributes>
        </div>
      </section>

      {/* PLACEMENT FORMATS */}
      <section className="sponsorizza-section" aria-labelledby="sponsorizza-formats-title">
        <header className="sponsorizza-section__header">
          <h2 id="sponsorizza-formats-title" className="sponsorizza-section__title"><LocalizedText>{"Formati disponibili"}</LocalizedText></h2>
          <p className="sponsorizza-section__lead"><LocalizedText>{"Quattro formati per raccontare il prodotto nel contesto più pertinente. Ogni presenza è dichiarata come sponsorizzata."}</LocalizedText></p>
        </header>

        <div className="sponsorizza-formats">
          {formatCards.map((card) => {
            const slugClass =
              card.slug === "spotlight"
                ? "sponsorizza-format-card--spotlight"
                : card.slug === "dispatch"
                  ? "sponsorizza-format-card--dispatch"
                  : card.slug === "collection"
                    ? "sponsorizza-format-card--collection"
                    : "";
            return (
              <article
                key={card.slug}
                className={`sponsorizza-format-card ${slugClass}`.trim()}
                aria-labelledby={`sponsorizza-format-${card.slug}-title`}
              >
                <span className="sponsorizza-format-card__index" aria-hidden="true">
                  <LocalizedText>{card.index}</LocalizedText>
                </span>
                <h3
                  id={`sponsorizza-format-${card.slug}-title`}
                  className="sponsorizza-format-card__title"
                >
                  <LocalizedText>{card.title}</LocalizedText>
                </h3>
                <span className="sponsorizza-format-card__label"><LocalizedText>{card.label}</LocalizedText></span>
                <p className="sponsorizza-format-card__copy"><LocalizedText>{card.copy}</LocalizedText></p>
                <ul className="sponsorizza-format-card__bullets">
                  {card.bullets.map((bullet) => (
                    <li key={bullet}><LocalizedText>{bullet}</LocalizedText></li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {/* EDITORIAL INDEPENDENCE */}
      <section className="sponsorizza-section" aria-labelledby="sponsorizza-independence-title">
        <div className="sponsorizza-independence">
          <h2
            id="sponsorizza-independence-title"
            className="sponsorizza-independence__title"
          ><LocalizedText>{"Indipendenza editoriale "}</LocalizedText></h2>

          <ul className="sponsorizza-independence__promises">
            <li>
              <span><LocalizedText>{"Giudizi, punteggi, classifiche e raccomandazioni dipendono solo dall’analisi dei tool."}</LocalizedText></span>
            </li>
            <li>
              <span><LocalizedText>{"Ogni presenza è indicata come contenuto sponsorizzato, ovunque appaia."}</LocalizedText></span>
            </li>
            <li>
              <span><LocalizedText>{"Le sponsorizzazioni non entrano nei Salvati e non influenzano i confronti personali."}</LocalizedText></span>
            </li>
          </ul>
        </div>
      </section>

      {/* LIVE EXAMPLE */}
      <section className="sponsorizza-section" aria-labelledby="sponsorizza-example-title">
        <header className="sponsorizza-section__header">
          <h2 id="sponsorizza-example-title" className="sponsorizza-section__title"><LocalizedText>{"La campagna Taylora"}</LocalizedText></h2>
          <p className="sponsorizza-section__lead"><LocalizedText>{"Taylora è una delle campagne online su TooolVibes. Qui vedi i testi e la grafica usati per presentare il prodotto."}</LocalizedText></p>
        </header>

        <div className="sponsorizza-example">
          <LocalizedAttributes><article
            className="sponsorizza-example__frame sponsorizza-example__frame--experience"
            aria-label={`Partner Experience per ${TAYLORA_CAMPAIGN.name}`}
          >
            <div className="sponsorizza-example__copy">
              <span className="sponsorizza-example__ribbon">
                <Sparkles aria-hidden="true" />
                <span><LocalizedText>{"Partner di TooolVibes"}</LocalizedText></span>
              </span>

              <div className="sponsorizza-example__identity">
                <span className="sponsorizza-example__logo" aria-hidden="true">
                  {TAYLORA_CAMPAIGN.name.slice(0, 1)}
                </span>
                <div className="sponsorizza-example__identity-copy">
                  <strong>{TAYLORA_CAMPAIGN.name}</strong>
                </div>
              </div>

              <p className="sponsorizza-example__headline"><LocalizedText>{TAYLORA_CAMPAIGN.headline}</LocalizedText></p>
              <p className="sponsorizza-example__description">
                <LocalizedText>{TAYLORA_CAMPAIGN.description}</LocalizedText>
              </p>

              <LocalizedAttributes><div className="sponsorizza-example__meta" aria-label="Dettagli della campagna">
                <span><LocalizedText>{"Contenuto sponsorizzato"}</LocalizedText></span>
                <span><LocalizedText>{"Homepage · Spotlight"}</LocalizedText></span>
              </div></LocalizedAttributes>

              <a
                className="sponsorizza-example__cta"
                href={TAYLORA_CAMPAIGN.destinationUrl}
                rel="sponsored noopener noreferrer"
                target="_blank"
              >
                <span><LocalizedText>{TAYLORA_CAMPAIGN.ctaLabel}</LocalizedText></span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>

            <div className="sponsorizza-example__visual" aria-hidden="true">
              <PartnerCreativeRenderer
                creativeVariant="taylora-flow"
                brandAsset={LIVE_PARTNER_CAMPAIGNS.find((c) => c.sponsorId === "taylora")?.brandAsset}
                partnerName="Taylora"
                density="stage"
              />
            </div>
          </article></LocalizedAttributes>

          <div className="sponsorizza-example__caption">
            <strong><LocalizedText>{"La creatività pubblicata"}</LocalizedText></strong>
            <span><LocalizedText>{"La grafica racconta come Taylora riunisce conoscenze, procedure e corsi in uno spazio protetto per il team, tracciandone il completamento. La dicitura “Partner di TooolVibes” distingue la sponsorizzazione."}</LocalizedText></span>
          </div>
        </div>

        <LocalizedAttributes><div className="sponsorizza-partners" aria-label="Campagne online">
          <p className="sponsorizza-partners__eyebrow"><LocalizedText>{"Campagne online"}</LocalizedText></p>
          <ul className="sponsorizza-partners__grid">
            {LIVE_PARTNER_CAMPAIGNS.map((campaign) => (
              <li
                key={campaign.id}
                className="sponsorizza-partners__card"
                data-partner-theme={partnerThemeKey(campaign.creativeTheme)}
              >
                <div className="sponsorizza-partners__visual" aria-hidden="true">
                  <PartnerCreativeRenderer
                    creativeVariant={campaign.creativeVariant}
                    creativeTheme={campaign.creativeTheme}
                    brandAsset={campaign.brandAsset}
                    partnerName={campaign.name}
                    density="strip"
                  />
                </div>
                <div className="sponsorizza-partners__copy">
                  <strong>{campaign.name}</strong>
                  <span><LocalizedText>{campaign.eyebrow}</LocalizedText></span>
                  <a
                    href={buildPartnerDestinationUrl(campaign, "sponsorizza-preview")}
                    rel="sponsored noopener noreferrer"
                    target="_blank"
                  >
                    <span><LocalizedText>{"Visita "}</LocalizedText>{campaign.name}</span>
                    <ArrowUpRight aria-hidden="true" />
                    <span className="sr-only"><LocalizedText>{"(link sponsorizzato)"}</LocalizedText></span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="sponsorizza-partners__note"><LocalizedText>{"Queste anteprime mostrano le campagne attive. In questa pagina non sono spazi a pagamento e non generano impression di campagna."}</LocalizedText></p>
        </div></LocalizedAttributes>
      </section>

      {/* PROCESS */}
      <section className="sponsorizza-section" aria-labelledby="sponsorizza-process-title">
        <header className="sponsorizza-section__header">
          <h2 id="sponsorizza-process-title" className="sponsorizza-section__title"><LocalizedText>{"Come funziona "}</LocalizedText></h2>
          <p className="sponsorizza-section__lead"><LocalizedText>{"Dalla prima richiesta ai risultati, in cinque passaggi."}</LocalizedText></p>
        </header>

        <ol className="sponsorizza-process">
          {processSteps.map((step, index) => (
            <li key={step.title} className="sponsorizza-process__step">
              <span className="sponsorizza-process__index" aria-hidden="true">
                <LocalizedText>{String(index + 1).padStart(2, "0")}</LocalizedText>
              </span>
              <h3 className="sponsorizza-process__title"><LocalizedText>{step.title}</LocalizedText></h3>
              <p className="sponsorizza-process__copy"><LocalizedText>{step.copy}</LocalizedText></p>
            </li>
          ))}
        </ol>
      </section>

      {/* FINAL CTA */}
      <section className="sponsorizza-section" aria-labelledby="sponsorizza-final-title">
        <div className="sponsorizza-final-cta">
          <div className="sponsorizza-final-cta__copy">
            <h2 id="sponsorizza-final-title" className="sponsorizza-final-cta__title"><LocalizedText>{"Parliamo della tua campagna."}</LocalizedText></h2>
            <p className="sponsorizza-final-cta__body"><LocalizedText>{"Scrivi a"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
              <a href="mailto:hello@tooolvibes.com"><LocalizedText>{"hello@tooolvibes.com"}</LocalizedText></a><LocalizedText>{" "}</LocalizedText><LocalizedText>{"per formati e disponibilità."}</LocalizedText></p>
          </div>
          <SponsorOpportunityMailtoLink
            placementId="sponsor-page-final-cta"
            route="/sponsorizza"
            href={SPONSOR_EMAIL}
            className="sponsorizza-final-cta__email"
          >
            <Mail aria-hidden="true" />
            <span><LocalizedText>{"Richiedi il media kit"}</LocalizedText></span>
            <ArrowRight aria-hidden="true" />
          </SponsorOpportunityMailtoLink>
        </div>
      </section>
    </div>
  );
}
