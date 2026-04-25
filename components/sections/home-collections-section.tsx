import Link from "next/link";

import type { CuratedCollection } from "@/lib/types/collection";
import { hasAdvancedSpecialIssue } from "@/lib/collections/format";

import { CollectionCard } from "@/components/collections/collection-card";
import { SectionHeading } from "@/components/sections/section-heading";

export function HomeCollectionsSection({
  collections,
}: {
  collections: CuratedCollection[];
}) {
  if (collections.length === 0) {
    return null;
  }

  const lead = collections.find((collection) => hasAdvancedSpecialIssue(collection)) ?? collections[0];

  return (
    <section className="tone-curate page-shell home-section-gap">
      <div className="brand-panel panel-lift curation-stage rounded-[34px] p-5 sm:p-6 lg:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider sm:pb-6">
          <SectionHeading
            eyebrow="Collection curate"
            title="La curation entra solo quando un contesto ti aiuta piu` della lista."
            description="Una collection forte basta a mostrarti che qui il percorso cambia: non stai piu` scremando, stai entrando da un angolo gia` pensato."
          />

          <div className="space-y-2 text-right">
            <span className="selection-status">{collections.length} collection attive</span>
            <Link href="/collections" className="section-quiet-link text-sm font-semibold" style={{ color: "var(--accent-strong)" }}>
              Apri tutte le collection
            </Link>
          </div>
        </div>

        {lead ? (
          <div className="mt-5">
            <CollectionCard collection={lead} variant="featured" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
