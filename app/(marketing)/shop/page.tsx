import type { Metadata } from "next";
import Link from "@/components/ui/app-link";
import { ArrowRight } from "lucide-react";
import { LocalizedText } from "@/components/i18n/localized-text";
import { SecondaryHero, SecondaryPageShell } from "@/components/secondary";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Shop TooolVibes",
  description: "Lo Shop è in preparazione. Esplora intanto i tool del catalogo e le raccolte TooolVibes.",
  path: "/shop",
});

export default function ShopPage() {
  return (
    <SecondaryPageShell className="resource-page">
      <SecondaryHero
        tone="dark"
        layout="stack"
        routeIndex="06"
        routeLabel="Shop"
        title="Lo Shop è in preparazione."
        emphasis="in preparazione"
        lede="Non ci sono ancora prodotti in vendita. Intanto, puoi esplorare i tool del catalogo e le raccolte."
        actions={
          <>
            <Link href="/archivio" className="secondary-card__cta">
              <LocalizedText>{"Esplora il catalogo"}</LocalizedText>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="/collections" className="secondary-card__cta secondary-card__cta--ghost">
              <LocalizedText>{"Esplora le raccolte"}</LocalizedText>
            </Link>
          </>
        }
      />
    </SecondaryPageShell>
  );
}
