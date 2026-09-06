import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileCheck2,
  Lightbulb,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";

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
  title: "Contributi editoriali",
  description:
    "Proponi un tool, racconta un flusso di lavoro o segnala una correzione alla redazione TooolVibes.",
  path: "/contributi",
  openGraphDescription:
    "Un canale editoriale per proporre tool, flussi e correzioni utili.",
});

const CONTRIBUTE_EMAIL_SUBJECT =
  "mailto:hello@tooolvibes.com?subject=Proposta%20per%20TooolVibes";

const CONTRIBUTION_TYPES = [
  {
    title: "Un tool da valutare",
    copy: "Indica il link ufficiale, il problema che risolve e per chi può essere utile. La redazione verifica e, se regge, lo inserisce nel Catalogo.",
    icon: <Sparkles className="size-4" aria-hidden="true" />,
    bullets: [
      "Link ufficiale + caso d'uso.",
      "Una sola mail, senza moduli o account.",
    ],
  },
  {
    title: "Un flusso che funziona",
    copy: "Racconta i passaggi essenziali e il contesto: la redazione può trasformarlo in una guida utile, citandoti se lo desideri.",
    icon: <Lightbulb className="size-4" aria-hidden="true" />,
    bullets: [
      "Passi · tool · contesto.",
      "Trasparente sui limiti noti.",
    ],
  },
  {
    title: "Una correzione",
    copy: "Se una scheda non è più precisa o completa, segnalarlo aiuta a mantenere il Catalogo affidabile. Le correzioni vengono revisionate a vista.",
    icon: <FileCheck2 className="size-4" aria-hidden="true" />,
    bullets: [
      "Link alla scheda + cosa è cambiato.",
      "Risposta della redazione in tempi chiari.",
    ],
  },
] as const;

const TRUST_PROMISES = [
  {
    title: "Lettura umana",
    copy: "Ogni proposta passa dalla redazione: nessuna pubblicazione automatica, nessun ranking gonfiato.",
  },
  {
    title: "Criteri editoriali",
    copy: "Le valutazioni vivono nel Metodo. Se un tool non regge i criteri, lo diciamo, anche dopo la pubblicazione.",
  },
  {
    title: "Risposta, non silenzio",
    copy: "Quando una proposta è fuori perimetro, lo spieghiamo. Non è una scatola nera, è una redazione.",
  },
] as const;

export default function ContributiPage() {
  return (
    <SecondaryPageShell>
      <SecondaryHero
        tone="dark"
        layout="split"
        routeIndex="07"
        routeLabel="Contributi"
        routeStatus="Canale editoriale"
        emphasis="contesto"
        title="Le scelte migliori meritano contesto."
        lede="Puoi proporre un tool, raccontare un flusso o correggere una scheda. Ogni invio viene letto dalla redazione: non promettiamo pubblicazioni automatiche."
        actions={
          <>
            <a
              href={CONTRIBUTE_EMAIL_SUBJECT}
              className="secondary-card__cta"
              aria-label="Scrivi alla redazione TooolVibes per proporre un contributo"
            >
              <Mail aria-hidden="true" className="size-4" />
              <span>Scrivi alla redazione</span>
            </a>
            <Link
              href="/shortlist#wishlist"
              className="secondary-card__cta secondary-card__cta--ghost"
            >
              <span>Aggiungi alla wishlist</span>
            </Link>
          </>
        }
        signature={
          <>
            <span className="secondary-hero__signature-eyebrow">
              <Send className="size-4" aria-hidden="true" />
              <span>Indirizzo della redazione</span>
            </span>
            <p
              style={{
                margin: 0,
                color: "var(--tv-ink-primary)",
                fontFamily: "var(--tv-font-family-ui)",
                fontSize: "1.4rem",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                fontWeight: 600,
              }}
            >
              <a
                href={CONTRIBUTE_EMAIL_SUBJECT}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                hello@tooolvibes.com
              </a>
            </p>
            <p
              style={{
                margin: 0,
                color: "var(--tv-ink-secondary)",
                fontFamily: "var(--tv-font-family-ui)",
                fontSize: "0.9rem",
                lineHeight: 1.55,
              }}
            >
              Una sola mail, nessun modulo. Scrivi il tag{" "}
              <strong style={{ color: "var(--tv-ink-primary)" }}>
                [tool]
              </strong>{" "}
              ·{" "}
              <strong style={{ color: "var(--tv-ink-primary)" }}>
                [flusso]
              </strong>{" "}
              ·{" "}
              <strong style={{ color: "var(--tv-ink-primary)" }}>
                [correzione]
              </strong>{" "}
              nella prima riga: aiuta la redazione a instradarla.
            </p>
          </>
        }
      />

      <SecondarySection
        eyebrow="Cosa puoi inviare"
        title="Tre tipi di contributo, una sola redazione"
        lede="I contributi migliori partono da un bisogno concreto e aiutano altre persone a scegliere. Sono tre i tagli che vale la pena proporre."
      >
        <SecondaryCardGrid columns={3}>
          {CONTRIBUTION_TYPES.map((type) => (
            <SecondaryPrincipleCard
              key={type.title}
              title={type.title}
              copy={type.copy}
              bullets={type.bullets}
              icon={type.icon}
            />
          ))}
        </SecondaryCardGrid>
      </SecondarySection>

      <SecondarySection
        tone="ivory"
        eyebrow="Come lavoriamo"
        title="Tre promesse editoriali"
        lede="TooolVibes è una redazione, non un portale. Ecco cosa significa in pratica per chi contribuisce."
      >
        <SecondaryCardGrid columns={3}>
          {TRUST_PROMISES.map((promise) => (
            <SecondaryPrincipleCard
              key={promise.title}
              title={promise.title}
              copy={promise.copy}
              tone="ivory"
            />
          ))}
        </SecondaryCardGrid>
      </SecondarySection>

      <SecondaryClosingCTA
        tone="dark"
        title="Hai qualcosa da proporre?"
        body="Una mail, un tag, un caso d'uso. La redazione risponde con una prima lettura editoriale, anche quando la proposta è fuori perimetro."
        actions={
          <>
            <a
              href={CONTRIBUTE_EMAIL_SUBJECT}
              className="secondary-card__cta"
              aria-label="Apri la mail per scrivere alla redazione"
            >
              <Mail aria-hidden="true" className="size-4" />
              <span>Scrivi a hello@tooolvibes.com</span>
            </a>
            <Link href="/metodo" className="secondary-card__cta secondary-card__cta--ghost">
              <span>Rileggi il Metodo</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </>
        }
      />
    </SecondaryPageShell>
  );
}
