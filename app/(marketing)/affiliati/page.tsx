import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, BadgeCheck, Mail, QrCode, ShieldCheck } from "lucide-react";

import { AffiliateApplicationForm } from "@/components/affiliates/affiliate-application-form";
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
  title: "Programma affiliati",
  description:
    "Candidati al programma affiliati TooolVibes e scopri come condividere la piattaforma con la tua community in modo editoriale e indipendente.",
  path: "/affiliati",
});

const AFFILIATE_EMAIL =
  "mailto:hello@tooolvibes.com?subject=Programma%20affiliati%20TooolVibes";

const programSteps = [
  {
    icon: <ShieldCheck className="size-4" aria-hidden="true" />,
    title: "Valutazione personale",
    copy: "Leggiamo ogni candidatura per capire pubblico, canali e modo in cui racconteresti TooolVibes.",
  },
  {
    icon: <BadgeCheck className="size-4" aria-hidden="true" />,
    title: "Conferma dedicata",
    copy: "Se il profilo è in linea, ti inviamo via email il codice e le indicazioni per iniziare.",
  },
  {
    icon: <QrCode className="size-4" aria-hidden="true" />,
    title: "Link e QR code",
    copy: "Ricevi un link personale e un QR code pronti da usare nei tuoi canali.",
  },
] as const;

const afterApprovalSteps = [
  {
    label: "01 · Setup",
    title: "Prepariamo il codice",
    copy: "Generiamo il codice referral dedicato e lo colleghiamo al profilo della tua candidatura approvata.",
  },
  {
    label: "02 · Materiali",
    title: "Link e QR code",
    copy: "Ricevi un link tracciato e un QR code da usare nei tuoi canali, pronti senza interventi tecnici.",
  },
  {
    label: "03 · Nuova candidatura",
    title: "Se la candidatura non va a buon fine",
    copy: "Puoi riprovare dopo 30 giorni. Nessuna black list: il motivo è sempre dichiarato in risposta.",
  },
] as const;

export default function AffiliatiPage() {
  return (
    <SecondaryPageShell>
      <LocalizedAttributes><SecondaryHero
        tone="dark"
        layout="split"
        routeIndex="10"
        routeLabel="Programma affiliati"
        routeStatus="Candidature aperte"
        emphasis="community"
        title="Porta TooolVibes alla tua community."
        lede="Hai una community interessata a software e AI? Raccontaci i tuoi canali e come vorresti presentare TooolVibes. Valutiamo ogni candidatura."
        actions={
          <LocalizedAttributes><a
            href="#affiliate-application"
            className="secondary-card__cta"
            aria-label="Salta al modulo di candidatura affiliato"
          >
            <Mail aria-hidden="true" className="size-4" />
            <span><LocalizedText>{"Candidati ora"}</LocalizedText></span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </a></LocalizedAttributes>
        }
        signature={
          <>
            <span className="secondary-hero__signature-eyebrow">
              <span><LocalizedText>{"Indipendenza editoriale"}</LocalizedText></span>
            </span>
            <p
              style={{
                margin: 0,
                color: "var(--tv-ink-primary)",
                fontFamily: "var(--tv-font-family-ui)",
                fontSize: "1.18rem",
                lineHeight: 1.35,
                fontWeight: 600,
              }}
            ><LocalizedText>{"La sponsorship non compra giudizi editoriali. "}</LocalizedText></p>
            <p
              style={{
                margin: 0,
                color: "var(--tv-ink-secondary)",
                fontFamily: "var(--tv-font-family-ui)",
                fontSize: "0.92rem",
                lineHeight: 1.55,
              }}
            ><LocalizedText>{"Valutazioni, classifiche e raccomandazioni restano indipendenti da chi promuove TooolVibes. Ogni affiliazione è dichiarata. "}</LocalizedText></p>
            <ul
              style={{
                margin: "0.4rem 0 0",
                padding: 0,
                listStyle: "none",
                display: "grid",
                gap: "0.4rem",
                color: "var(--tv-ink-secondary)",
                fontFamily: "var(--tv-font-family-ui)",
                fontSize: "var(--tv-text-label)",
                lineHeight: 1.5,
              }}
            >
              <li><LocalizedText>{"· Codice referral personale"}</LocalizedText></li>
              <li><LocalizedText>{"· Link tracciato e QR code"}</LocalizedText></li>
              <li><LocalizedText>{"· Nuovo invio dopo 30 giorni"}</LocalizedText></li>
            </ul>
          </>
        }
      /></LocalizedAttributes>

      <LocalizedAttributes><section
        className="affiliates-layout"
        aria-label="Modulo e vantaggi del programma"
      >
        <LocalizedAttributes><aside
          className="affiliates-intro"
          aria-label="Per chi è il programma affiliati"
        >
          <p className="secondary-section__eyebrow"><LocalizedText>{"Per chi è"}</LocalizedText></p>
          <h2 className="secondary-section__title"><LocalizedText>{"Un programma per chi racconta tool con cura. "}</LocalizedText></h2>
          <p className="secondary-section__lede"><LocalizedText>{"Cerchiamo persone che parlano di tool AI, automazioni, no-code e scelte software a una audience che vuole capire prima di installare. Non compri visibilità: costruiamo come TooolVibes entra nelle tue conversazioni. "}</LocalizedText></p>

          <LocalizedAttributes><dl className="affiliates-intro__list" aria-label="Criteri del programma">
            <div className="affiliates-intro__item">
              <dt><LocalizedText>{"Valutazione"}</LocalizedText></dt>
              <dd><LocalizedText>{"Personale, non automatica"}</LocalizedText></dd>
            </div>
            <div className="affiliates-intro__item">
              <dt><LocalizedText>{"Codice"}</LocalizedText></dt>
              <dd><LocalizedText>{"Dedicato alla tua identità"}</LocalizedText></dd>
            </div>
            <div className="affiliates-intro__item">
              <dt><LocalizedText>{"Nuovo invio"}</LocalizedText></dt>
              <dd><LocalizedText>{"Dopo 30 giorni se rifiutato"}</LocalizedText></dd>
            </div>
          </dl></LocalizedAttributes>

          <div className="affiliates-intro__contact">
            <p className="affiliates-intro__contact-label"><LocalizedText>{"Domande prima di candidarti? "}</LocalizedText></p>
            <LocalizedAttributes><a
              href={AFFILIATE_EMAIL}
              className="secondary-card__cta secondary-card__cta--ghost"
              aria-label="Scrivi a TooolVibes per chiedere informazioni sul programma affiliati"
            >
              <Mail aria-hidden="true" className="size-4" />
              <span><LocalizedText>{"Scrivi a hello@tooolvibes.com"}</LocalizedText></span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a></LocalizedAttributes>
          </div>
        </aside></LocalizedAttributes>

        <div id="affiliate-application" className="affiliates-form-wrap">
          <AffiliateApplicationForm />
        </div>
      </section></LocalizedAttributes>

      <LocalizedAttributes><SecondarySection
        eyebrow="Programma in 3 passi"
        title="Cosa succede quando ti candidi"
        lede="Leggiamo la proposta e ti rispondiamo via email con l’esito e i passaggi successivi."
      >
        <SecondaryCardGrid columns={3}>
          {programSteps.map((step) => (
            <LocalizedAttributes key={step.title}><SecondaryPrincipleCard
              key={step.title}
              icon={step.icon}
              title={step.title}
              copy={step.copy}
            /></LocalizedAttributes>
          ))}
        </SecondaryCardGrid>
      </SecondarySection></LocalizedAttributes>

      <LocalizedAttributes><SecondarySection
        tone="ivory"
        eyebrow="Dopo l'approvazione"
        title="Come funziona"
        lede="Dopo l’approvazione, prepariamo il codice e i materiali per i tuoi canali."
      >
        <LocalizedAttributes><ol className="affiliates-after" aria-label="Cosa succede dopo l'approvazione">
          {afterApprovalSteps.map((step) => (
            <li key={step.label} className="affiliates-after__step">
              <span className="affiliates-after__label"><LocalizedText>{step.label}</LocalizedText></span>
              <h3 className="affiliates-after__title"><LocalizedText>{step.title}</LocalizedText></h3>
              <p className="affiliates-after__copy"><LocalizedText>{step.copy}</LocalizedText></p>
            </li>
          ))}
        </ol></LocalizedAttributes>
      </SecondarySection></LocalizedAttributes>

      <LocalizedAttributes><SecondaryClosingCTA
        tone="dark"
        title="Hai una community che ascolta i tuoi consigli sui tool?"
        body="Presentaci il tuo pubblico e il tuo progetto. Ti rispondiamo dopo averli valutati."
        actions={
          <>
            <LocalizedAttributes><a
              href="#affiliate-application"
              className="secondary-card__cta"
              aria-label="Salta al modulo di candidatura"
            >
              <Mail aria-hidden="true" className="size-4" />
              <span><LocalizedText>{"Candidati ora"}</LocalizedText></span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </a></LocalizedAttributes>
            <LocalizedAttributes><a
              href={AFFILIATE_EMAIL}
              className="secondary-card__cta secondary-card__cta--ghost"
              aria-label="Scrivi a TooolVibes per chiedere informazioni"
            >
              <span><LocalizedText>{"Scrivi a hello@tooolvibes.com"}</LocalizedText></span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a></LocalizedAttributes>
          </>
        }
      /></LocalizedAttributes>
    </SecondaryPageShell>
  );
}
