import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Layers3, Sparkles } from "lucide-react";

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
  title: "Shop editoriale",
  description:
    "Lo Shop TooolVibes è in preparazione: oggi puoi esplorare il Catalogo e le Raccolte editoriali, senza checkout o prezzi.",
  path: "/shop",
  openGraphDescription:
    "Lo Shop TooolVibes è in preparazione. Il prodotto editoriale resta nel Catalogo e nelle Raccolte.",
});

const SCARCITY_BADGE = "In preparazione";

const CARDS = [
  {
    title: "Stato attuale",
    copy: "Non sono disponibili prodotti, prezzi, checkout o acquisti. Questa pagina resta visibile per spiegare con chiarezza lo stato dello Shop.",
    icon: <Layers3 className="size-4" aria-hidden="true" />,
    example: "Puoi già usare senza registrazione Catalogo, Confronto, Salvati e Raccolte.",
  },
  {
    title: "Contenuto editoriale",
    copy: "Le selezioni pubblicate da TooolVibes rimangono nel prodotto, dove puoi verificarne il contesto e confrontare i tool inclusi.",
    icon: <FileText className="size-4" aria-hidden="true" />,
    example: "Le Raccolte sono accessibili dal sito, senza una promessa di sblocco a pagamento.",
  },
  {
    title: "Quando sarà pronto",
    copy: "Eventuali risorse future saranno pubblicate qui solo quando destinazione, contenuto e condizioni saranno verificabili.",
    icon: <Sparkles className="size-4" aria-hidden="true" />,
    example: "Fino ad allora non trovi link esterni, cataloghi fittizi o inviti all'acquisto.",
  },
] as const;

const INVENTORY = [
  { title: "Prodotti pubblicati", value: "0", caption: "Nessun catalogo finto" },
  { title: "Risorse in lavorazione", value: "0", caption: "Solo se verificabili" },
  { title: "Periodo di apertura", value: "Non annunciato", caption: "Nessuna data pubblica" },
] as const;

export default function ShopPage() {
  return (
    <SecondaryPageShell className="resource-page">
      <SecondaryHero
        tone="dark"
        layout="split"
        routeIndex="06"
        routeLabel="Shop digitale"
        routeStatus="In preparazione"
        emphasis="in preparazione"
        title="Lo Shop TooolVibes è in preparazione."
        lede="Oggi non vendiamo prodotti né indirizziamo a un checkout esterno. Per decidere meglio puoi partire dal Catalogo, dalle Raccolte editoriali e dal Confronto."
        actions={
          <>
            <Link href="/archivio" className="secondary-card__cta">
              <span>Esplora il Catalogo</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/collections"
              className="secondary-card__cta secondary-card__cta--ghost"
            >
              <span>Vedi le Raccolte</span>
            </Link>
          </>
        }
        signature={
          <InventoryPanel
            badge={SCARCITY_BADGE}
            items={INVENTORY}
            status="Nessun acquisto attivo"
          />
        }
      />

      <SecondarySection
        eyebrow="Inventario"
        title="Cosa puoi aspettarti, oggi"
        lede="Lo Shop è una promessa futura. Quello che esiste davvero oggi è nel prodotto editoriale, ed è lì che vale la pena iniziare."
      >
        <SecondaryCardGrid columns={3}>
          {CARDS.map((card) => (
            <SecondaryPrincipleCard
              key={card.title}
              title={card.title}
              copy={card.copy}
              icon={card.icon}
            />
          ))}
        </SecondaryCardGrid>
      </SecondarySection>

      <SecondarySection
        tone="ivory"
        eyebrow="Una promessa verificabile"
        title="Per ora, il posto giusto per decidere resta il prodotto."
        lede="Quando lo Shop sarà pronto, lo annunceremo qui. Fino ad allora, le Raccolte e il Catalogo sono sufficienti — e continuano a migliorare."
      >
        <SecondaryCardGrid columns={3}>
          <SecondaryPrincipleCard
            title="Solo risorse verificabili"
            copy="Prima di pubblicare un prodotto, verifichiamo fonte, condizioni e limiti. La pagina Shop resta in silenzio fino a quel momento."
            tone="ivory"
          />
          <SecondaryPrincipleCard
            title="Senza pressione"
            copy="Nessun conto alla rovescia, nessun &quot;prima che sia troppo tardi&quot;. Le decisioni prese sotto pressione sono raramente buone decisioni."
            tone="ivory"
          />
          <SecondaryPrincipleCard
            title="Trasparenza editoriale"
            copy="Se lo Shop dovesse contenere placement, saranno etichettati come contenuto sponsorizzato. Il Catalogo resta indipendente."
            tone="ivory"
          />
        </SecondaryCardGrid>
      </SecondarySection>

      <SecondaryClosingCTA
        tone="dark"
        title="Inizia dal Catalogo, non dalla vetrina."
        body="Se vuoi suggerire una risorsa o un flusso che merita una guida editoriale, puoi farlo anche adesso — la redazione legge ogni proposta."
        actions={
          <>
            <Link href="/archivio" className="secondary-card__cta">
              <span>Apri il Catalogo</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/collections"
              className="secondary-card__cta secondary-card__cta--ghost"
            >
              <span>Vai alle Raccolte</span>
            </Link>
          </>
        }
      />
    </SecondaryPageShell>
  );
}

import type { ReactNode } from "react";

function InventoryPanel({
  badge,
  items,
  status,
}: {
  badge: string;
  items: ReadonlyArray<{ title: string; value: string; caption: string }>;
  status: string;
}) {
  const [head, ...rest] = items;
  return (
    <div className="resource-inventory">
      <div className="resource-inventory__status">
        <div>
          <p className="resource-inventory__kicker">Stato dello Shop</p>
          <p className="resource-inventory__title">{status}</p>
        </div>
        <span className="resource-inventory__badge">{badge}</span>
      </div>
      {head ? (
        <InventoryRow index={1} label={head.title} value={head.value} caption={head.caption} highlight />
      ) : null}
      {rest.map((item, idx) => (
        <InventoryRow
          key={item.title}
          index={idx + 2}
          label={item.title}
          value={item.value}
          caption={item.caption}
        />
      ))}
    </div>
  );
}

function InventoryRow({
  index,
  label,
  value,
  caption,
  highlight = false,
}: {
  index: ReactNode;
  label: string;
  value: string;
  caption: string;
  highlight?: boolean;
}) {
  return (
    <div className="resource-inventory__row" data-highlight={highlight ? "true" : "false"}>
      <span className="resource-inventory__index">{index}</span>
      <span style={{ display: "grid", gap: "0.1rem" }}>
        <strong
          style={{
            color: "var(--tv-ink-primary)",
            fontFamily: "var(--tv-font-ui)",
            fontSize: "0.85rem",
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {label}
        </strong>
        <span
          style={{
            color: "var(--tv-ink-secondary)",
            fontFamily: "var(--tv-font-ui)",
            fontSize: "0.75rem",
            lineHeight: 1.4,
          }}
        >
          {caption}
        </span>
      </span>
      <span className="resource-inventory__value">{value}</span>
    </div>
  );
}
