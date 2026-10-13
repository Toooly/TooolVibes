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
    label: "Homepage · Partner Experience",
    copy:
      "Una branded experience dentro la home: identità del brand, headline in scala editoriale e un visual cinetico che racconta il prodotto in azione.",
    bullets: [
      "Visibilità massima nella superficie di atterraggio del prodotto.",
      "Visual narrativo costruito sul prodotto del partner, non un riquadro decorativo.",
      "Disciplina di priorità: una sola Spotlight attiva per periodo.",
    ],
  },
  {
    slug: "tool-card",
    index: "02",
    title: "Catalog Insert",
    label: "Catalogo · dentro la discovery",
    copy:
      "Un'interruzione editoriale dentro il flusso di discovery del catalogo: silhouette propria, nessun punteggio, nessuna classifica.",
    bullets: [
      "Inserita tra le schede organiche durante l'esplorazione, non in coda alla pagina.",
      "Etichetta trasparente che distingue il contenuto sponsorizzato.",
      "Mini-visual narrativo e CTA dedicata verso il prodotto.",
    ],
  },
  {
    slug: "dispatch",
    index: "03",
    title: "Contextual Experience",
    label: "Guide · storia partner contestuale",
    copy:
      "Una storia partner dentro i contenuti editoriali pertinenti: guide, raccolte e articoli, in contesto con il tema trattato.",
    bullets: [
      "Inserita vicino al contenuto editoriale che ha più attinenza.",
      "Narrazione contestuale, non un banner: la leggono perché è utile.",
      "Disponibile su richiesta per articoli e guide pertinenti.",
    ],
  },
  {
    slug: "collection",
    index: "04",
    title: "Collection Partner",
    label: "Raccolte · verticale curatoriale",
    copy:
      "Presenza partner dentro una raccolta curata e coerente: il brand si associa a un percorso tematico, mai alla selezione dei tool.",
    bullets: [
      "La pertinenza deriva dai tool inclusi nella raccolta, non da keyword libere.",
      "Nessuna influenza su quali tool entrano, sul loro ordine o sui giudizi editoriali.",
      "Una sola attribuzione partner per raccolta: spazio raro, non un catalogo di loghi.",
    ],
  },
];

const processSteps: ReadonlyArray<{ title: string; copy: string }> = [
  {
    title: "Richiedi informazioni",
    copy:
      "Scrivi a hello@tooolvibes.com con una breve presentazione del tool e degli obiettivi della campagna.",
  },
  {
    title: "Valutazione editoriale",
    copy:
      "Il team editoriale verifica che il tool sia coerente con il catalogo e i criteri qualitativi di TooolVibes.",
  },
  {
    title: "Preparazione creatività",
    copy:
      "Definiamo insieme formato, headline, descrizione e CTA, con un ciclo di revisione prima della pubblicazione.",
  },
  {
    title: "Campagna live",
    copy:
      "Il placement va online nei tempi concordati, con disclosure chiara e monitoraggio continuo della qualità.",
  },
  {
    title: "Report",
    copy:
      "A fine campagna condividiamo un report sintetico con impression, click e segnali di coinvolgimento.",
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
            <h1 id="sponsorizza-hero-title" className="sponsorizza-hero__title"><LocalizedText>{"Porta il tuo tool davanti a chi sta già decidendo cosa usare. "}</LocalizedText></h1>
            <p className="sponsorizza-hero__subtitle"><LocalizedText>{"TooolVibes crea Partner Experience contestuali per prodotti selezionati, davanti a founder, product manager e professionisti che stanno confrontando tool per il loro stack. Non compri uno spazio: costruiamo come il tuo prodotto entra in TooolVibes. "}</LocalizedText></p>
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

          <LocalizedAttributes><aside className="sponsorizza-hero__visual" aria-label="In evidenza · partner attivi">
            <div className="sponsorizza-hero__visual-title">
              <span>
                <strong><LocalizedText>{"Decision mode"}</LocalizedText></strong><LocalizedText>{" · audience attiva "}</LocalizedText></span>
              <span><LocalizedText>{"Live"}</LocalizedText></span>
            </div>
            <div className="sponsorizza-hero__visual-row">
              <span className="sponsorizza-hero__visual-marker" aria-hidden="true">
                <Target />
              </span>
              <span>
                <strong><LocalizedText>{"Founder & PM"}</LocalizedText></strong>
                <span><LocalizedText>{"Cercano e confrontano tool per i loro stack operativi."}</LocalizedText></span>
              </span>
              <em><LocalizedText>{"Attivi"}</LocalizedText></em>
            </div>
            <div className="sponsorizza-hero__visual-row">
              <span className="sponsorizza-hero__visual-marker" aria-hidden="true">
                <LayoutGrid />
              </span>
              <span>
                <strong><LocalizedText>{"Catalogo & Radar"}</LocalizedText></strong>
                <span><LocalizedText>{"Navigazione, filtri e segnali live su Product Hunt."}</LocalizedText></span>
              </span>
              <em><LocalizedText>{"Live"}</LocalizedText></em>
            </div>
            <div className="sponsorizza-hero__visual-row">
              <span className="sponsorizza-hero__visual-marker" aria-hidden="true">
                <BookOpenText />
              </span>
              <span>
                <strong><LocalizedText>{"Guide editoriali"}</LocalizedText></strong>
                <span><LocalizedText>{"Letture di approfondimento su categorie e workflow."}</LocalizedText></span>
              </span>
              <em><LocalizedText>{"Indici"}</LocalizedText></em>
            </div>
          </aside></LocalizedAttributes>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="sponsorizza-section" aria-labelledby="sponsorizza-audience-title">
        <header className="sponsorizza-section__header">
          <span className="sponsorizza-section__eyebrow"><LocalizedText>{"Audience"}</LocalizedText></span>
          <h2 id="sponsorizza-audience-title" className="sponsorizza-section__title"><LocalizedText>{"Chi raggiungi "}</LocalizedText></h2>
          <p className="sponsorizza-section__lead"><LocalizedText>{"L’audience di TooolVibes sta attivamente esplorando, confrontando e valutando tool. Non scorre passivamente: è in modalità decisionale, con un obiettivo chiaro e un budget da allocare. "}</LocalizedText></p>
        </header>

        <div className="sponsorizza-audience">
          <div className="sponsorizza-audience__copy">
            <p><LocalizedText>{"Su TooolVibes le persone arrivano con un intento preciso: stanno scegliendo tool da inserire in uno stack, validare un’ipotesi di prodotto o sostituire qualcosa che non regge più. "}</LocalizedText></p>
            <p><LocalizedText>{"La sponsorship ti inserisce in quel momento: quando la decisione è aperta e il confronto è già in corso, non dopo che la scelta è stata fatta. "}</LocalizedText></p>
          </div>

          <LocalizedAttributes><div className="sponsorizza-audience__visual" aria-label="Segnali di decision mode">
            <div className="sponsorizza-audience__visual-row">
              <span className="dot" aria-hidden="true" />
              <span>
                <strong><LocalizedText>{"Ricerca attiva nel catalogo"}</LocalizedText></strong>
                <span><LocalizedText>{"Filtri per categoria, confronto attributi, shortlist personali."}</LocalizedText></span>
              </span>
            </div>
            <div className="sponsorizza-audience__visual-row is-violet">
              <span className="dot" aria-hidden="true" />
              <span>
                <strong><LocalizedText>{"Confronto side-by-side"}</LocalizedText></strong>
                <span><LocalizedText>{"Decision workspace con matrice di attributi e shortlist."}</LocalizedText></span>
              </span>
            </div>
            <div className="sponsorizza-audience__visual-row is-warm">
              <span className="dot" aria-hidden="true" />
              <span>
                <strong><LocalizedText>{"Segnali Radar e Product Hunt"}</LocalizedText></strong>
                <span><LocalizedText>{"Lanci live, voti, commenti, evidenza recente."}</LocalizedText></span>
              </span>
            </div>
            <div className="sponsorizza-audience__visual-row">
              <span className="dot" aria-hidden="true" />
              <span>
                <strong><LocalizedText>{"Lettura editoriale"}</LocalizedText></strong>
                <span><LocalizedText>{"Guide, raccolte, approfondimenti tematici e di metodo."}</LocalizedText></span>
              </span>
            </div>
          </div></LocalizedAttributes>
        </div>
      </section>

      {/* PLACEMENT FORMATS */}
      <section className="sponsorizza-section" aria-labelledby="sponsorizza-formats-title">
        <header className="sponsorizza-section__header">
          <span className="sponsorizza-section__eyebrow"><LocalizedText>{"Partner Experience"}</LocalizedText></span>
          <h2 id="sponsorizza-formats-title" className="sponsorizza-section__title"><LocalizedText>{"Una partnership, più contesti ad alta intenzione "}</LocalizedText></h2>
          <p className="sponsorizza-section__lead"><LocalizedText>{"La stessa identità e lo stesso racconto di prodotto prendono forma in tre contesti: scoperta, confronto, lettura. Ogni esperienza è etichettata come contenuto sponsorizzato e non influenza le valutazioni editoriali. "}</LocalizedText></p>
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
          <span className="sponsorizza-independence__seal">
            <Sparkles aria-hidden="true" />
            <span><LocalizedText>{"Indipendenza editoriale"}</LocalizedText></span>
          </span>
          <h2
            id="sponsorizza-independence-title"
            className="sponsorizza-independence__title"
          ><LocalizedText>{"Indipendenza editoriale "}</LocalizedText></h2>
          <p className="sponsorizza-independence__body"><LocalizedText>{"La sponsorship "}</LocalizedText><strong><LocalizedText>{"non influenza mai"}</LocalizedText></strong><LocalizedText>{" le valutazioni, i punteggi, le classifiche o le raccomandazioni di TooolVibes. Ogni placement è chiaramente etichettato come contenuto sponsorizzato. I giudizi editoriali restano indipendenti e basati esclusivamente sull’analisi oggettiva dei tool. "}</LocalizedText></p>

          <ul className="sponsorizza-independence__promises">
            <li>
              <span><LocalizedText>{"Le valutazioni editoriali, i punteggi e le classifiche di TooolVibes restano indipendenti dalla sponsorship. "}</LocalizedText></span>
            </li>
            <li>
              <span><LocalizedText>{"Ogni placement è chiaramente etichettato come contenuto sponsorizzato in ogni superficie in cui appare. "}</LocalizedText></span>
            </li>
            <li>
              <span><LocalizedText>{"I placement non compaiono nelle shortlist personali né influenzano i confronti generati dagli utenti. "}</LocalizedText></span>
            </li>
          </ul>
        </div>
      </section>

      {/* LIVE EXAMPLE */}
      <section className="sponsorizza-section" aria-labelledby="sponsorizza-example-title">
        <header className="sponsorizza-section__header">
          <span className="sponsorizza-section__eyebrow"><LocalizedText>{"Esempio reale"}</LocalizedText></span>
          <h2 id="sponsorizza-example-title" className="sponsorizza-section__title"><LocalizedText>{"Un esempio reale "}</LocalizedText></h2>
          <p className="sponsorizza-section__lead"><LocalizedText>{"Taylora è una delle campagne partner attualmente live su TooolVibes. Questa è la Partner Experience reale: non una card premium, ma un piccolo palcoscenico editoriale con un visual che spiega il prodotto prima ancora del testo. "}</LocalizedText></p>
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
                  <span><LocalizedText>{"Partner di TooolVibes"}</LocalizedText></span>
                </div>
              </div>

              <p className="sponsorizza-example__headline"><LocalizedText>{TAYLORA_CAMPAIGN.headline}</LocalizedText></p>
              <p className="sponsorizza-example__description">
                <LocalizedText>{TAYLORA_CAMPAIGN.description}</LocalizedText>
              </p>

              <LocalizedAttributes><div className="sponsorizza-example__meta" aria-label="Dettagli del placement">
                <span><LocalizedText>{"Disciplina · Contenuto sponsorizzato"}</LocalizedText></span>
                <span><LocalizedText>{"Homepage · Partner Spotlight"}</LocalizedText></span>
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
            <strong><LocalizedText>{"La stessa creatività che va in produzione"}</LocalizedText></strong>
            <span><LocalizedText>{"Il visual qui sopra è la Partner Experience reale: conoscenza, procedure e corsi del partner confluiscono in un workspace protetto e raggiungono il team, con tracciamento dei completamenti. Il placement mostra chiaramente la label “Partner di TooolVibes”; nessun punteggio, valutazione o classifica di TooolVibes è modificato dalla presenza di questa sponsorship. "}</LocalizedText></span>
          </div>
        </div>

        <LocalizedAttributes><div className="sponsorizza-partners" aria-label="Partner Experience live">
          <p className="sponsorizza-partners__eyebrow"><LocalizedText>{"Partner Experience live"}</LocalizedText></p>
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
          <p className="sponsorizza-partners__note"><LocalizedText>{"Anteprime dimostrative dei mondi creativi attivi: non sono placement a pagamento in questa pagina e non registrano impression di campagna. "}</LocalizedText></p>
        </div></LocalizedAttributes>
      </section>

      {/* PROCESS */}
      <section className="sponsorizza-section" aria-labelledby="sponsorizza-process-title">
        <header className="sponsorizza-section__header">
          <span className="sponsorizza-section__eyebrow"><LocalizedText>{"Processo"}</LocalizedText></span>
          <h2 id="sponsorizza-process-title" className="sponsorizza-section__title"><LocalizedText>{"Come funziona "}</LocalizedText></h2>
          <p className="sponsorizza-section__lead"><LocalizedText>{"Un percorso chiaro in cinque tappe: dalla prima richiesta al report di fine campagna. "}</LocalizedText></p>
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
            <h2 id="sponsorizza-final-title" className="sponsorizza-final-cta__title"><LocalizedText>{"Il prossimo tool in evidenza potrebbe essere il tuo. "}</LocalizedText></h2>
            <p className="sponsorizza-final-cta__body"><LocalizedText>{"Scrivi a"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
              <a href="mailto:hello@tooolvibes.com"><LocalizedText>{"hello@tooolvibes.com"}</LocalizedText></a><LocalizedText>{" "}</LocalizedText><LocalizedText>{"per ricevere il media kit e i dettagli sui formati disponibili. "}</LocalizedText></p>
          </div>
          <SponsorOpportunityMailtoLink
            placementId="sponsor-page-final-cta"
            route="/sponsorizza"
            href={SPONSOR_EMAIL}
            className="sponsorizza-final-cta__email"
          >
            <Mail aria-hidden="true" />
            <span><LocalizedText>{"Scrivi a hello@tooolvibes.com"}</LocalizedText></span>
            <ArrowRight aria-hidden="true" />
          </SponsorOpportunityMailtoLink>
        </div>
      </section>
    </div>
  );
}
