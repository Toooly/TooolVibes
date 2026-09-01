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
    label: "03 · Cooldown",
    title: "Se la candidatura non va a buon fine",
    copy: "Puoi riprovare dopo 30 giorni. Nessuna black list: il motivo è sempre dichiarato in risposta.",
  },
] as const;

export default function AffiliatiPage() {
  return (
    <SecondaryPageShell>
      <SecondaryHero
        tone="dark"
        layout="split"
        routeIndex="10"
        routeLabel="Programma affiliati"
        routeStatus="Candidature aperte"
        emphasis="community"
        title="Porta TooolVibes alla tua community."
        lede="Cerchiamo creator, newsletter, community e professionisti che parlano con persone interessate a tool AI, automazioni e scelte software più lucide. Il programma è su richiesta: ogni candidatura viene letta."
        actions={
          <a
            href="#affiliate-application"
            className="secondary-card__cta"
            aria-label="Salta al modulo di candidatura affiliato"
          >
            <Mail aria-hidden="true" className="size-4" />
            <span>Candidati ora</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        }
        signature={
          <>
            <span className="secondary-hero__signature-eyebrow">
              <span>Indipendenza editoriale</span>
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
            >
              La sponsorship non compra giudizi editoriali.
            </p>
            <p
              style={{
                margin: 0,
                color: "var(--tv-ink-secondary)",
                fontFamily: "var(--tv-font-family-ui)",
                fontSize: "0.92rem",
                lineHeight: 1.55,
              }}
            >
              Valutazioni, classifiche e raccomandazioni restano indipendenti da chi promuove TooolVibes. Ogni affiliazione è dichiarata.
            </p>
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
              <li>· Codice referral personale</li>
              <li>· Link tracciato e QR code</li>
              <li>· Nuovo invio dopo 30 giorni</li>
            </ul>
          </>
        }
      />

      <section
        className="affiliates-layout"
        aria-label="Modulo e vantaggi del programma"
      >
        <aside
          className="affiliates-intro"
          aria-label="Per chi è il programma affiliati"
        >
          <p className="secondary-section__eyebrow">Per chi è</p>
          <h2 className="secondary-section__title">
            Un programma per chi racconta tool con cura.
          </h2>
          <p className="secondary-section__lede">
            Cerchiamo persone che parlano di tool AI, automazioni, no-code e scelte software a una
            audience che vuole capire prima di installare. Non compri visibilità: costruiamo come
            TooolVibes entra nelle tue conversazioni.
          </p>

          <dl className="affiliates-intro__list" aria-label="Criteri del programma">
            <div className="affiliates-intro__item">
              <dt>Valutazione</dt>
              <dd>Personale, non automatica</dd>
            </div>
            <div className="affiliates-intro__item">
              <dt>Codice</dt>
              <dd>Dedicato alla tua identità</dd>
            </div>
            <div className="affiliates-intro__item">
              <dt>Nuovo invio</dt>
              <dd>Dopo 30 giorni se rifiutato</dd>
            </div>
          </dl>

          <div className="affiliates-intro__contact">
            <p className="affiliates-intro__contact-label">
              Domande prima di candidarti?
            </p>
            <a
              href={AFFILIATE_EMAIL}
              className="secondary-card__cta secondary-card__cta--ghost"
              aria-label="Scrivi a TooolVibes per chiedere informazioni sul programma affiliati"
            >
              <Mail aria-hidden="true" className="size-4" />
              <span>Scrivi a hello@tooolvibes.com</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        </aside>

        <div id="affiliate-application" className="affiliates-form-wrap">
          <AffiliateApplicationForm />
        </div>
      </section>

      <SecondarySection
        eyebrow="Programma in 3 passi"
        title="Cosa succede quando ti candidi"
        lede="Un percorso lineare e trasparente. Nessuna procedura opaca, nessuna risposta automatica."
      >
        <SecondaryCardGrid columns={3}>
          {programSteps.map((step) => (
            <SecondaryPrincipleCard
              key={step.title}
              icon={step.icon}
              title={step.title}
              copy={step.copy}
            />
          ))}
        </SecondaryCardGrid>
      </SecondarySection>

      <SecondarySection
        tone="ivory"
        eyebrow="Dopo l'approvazione"
        title="Come funziona"
        lede="Una volta confermata la candidatura, il setup è meccanico: noi prepariamo tutto, tu ricevi i materiali."
      >
        <ol className="affiliates-after" aria-label="Cosa succede dopo l'approvazione">
          {afterApprovalSteps.map((step) => (
            <li key={step.label} className="affiliates-after__step">
              <span className="affiliates-after__label">{step.label}</span>
              <h3 className="affiliates-after__title">{step.title}</h3>
              <p className="affiliates-after__copy">{step.copy}</p>
            </li>
          ))}
        </ol>
      </SecondarySection>

      <SecondaryClosingCTA
        tone="dark"
        title="Hai una community che ascolta i tuoi consigli sui tool?"
        body="Candidati ora. La valutazione è personale: ti rispondiamo anche quando la risposta è onesta &quot;non è il nostro perimetro&quot;."
        actions={
          <>
            <a
              href="#affiliate-application"
              className="secondary-card__cta"
              aria-label="Salta al modulo di candidatura"
            >
              <Mail aria-hidden="true" className="size-4" />
              <span>Candidati ora</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <a
              href={AFFILIATE_EMAIL}
              className="secondary-card__cta secondary-card__cta--ghost"
              aria-label="Scrivi a TooolVibes per chiedere informazioni"
            >
              <span>Scrivi a hello@tooolvibes.com</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </>
        }
      />
    </SecondaryPageShell>
  );
}
