import type { Metadata } from "next";
import Link from "@/components/ui/app-link";
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
        signature={<InventoryPanel />}
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

function InventoryPanel() {
  return (
    <div className="resource-inventory">
      <p className="resource-inventory__stamp">
        <span className="resource-inventory__stamp-mark">In preparazione</span>
        <span className="resource-inventory__stamp-copy">
          Nessun prodotto, prezzo o checkout. Catalogo e Raccolte restano
          disponibili.
        </span>
      </p>
    </div>
  );
}
