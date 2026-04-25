import Link from "next/link";

import type { CuratedCollection } from "@/lib/types/collection";

import { CollectionCard } from "@/components/collections/collection-card";

export function ArchiveCollectionsStrip({
  collections,
}: {
  collections: CuratedCollection[];
}) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="tone-curate brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider">
        <div className="max-w-[42rem]">
          <p className="editorial-label">Collection curate</p>
          <h2 className="text-display-card mt-2.5 max-w-none text-[1.56rem] sm:max-w-[17ch] sm:text-[1.88rem] sm:text-balance">
            Quando non vuoi partire da un nome, entra da una collection.
          </h2>
          <p className="text-body-soft mt-3 text-[0.95rem]" style={{ color: "var(--muted-strong)" }}>
            Le collection non sostituiscono i filtri. Ti danno un ingresso piu` guidato quando vuoi partire da un contesto coerente invece che da una lista.
          </p>
        </div>
        <Link
          href="/collections"
          className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          Vedi tutte le collection
        </Link>
      </div>

      <div className="tool-rail -mx-1.5 mt-5 flex snap-x gap-4 overflow-x-auto px-1.5 pb-1 md:hidden">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} variant="compact" swipeFriendly />
        ))}
      </div>

      <div className="mt-5 hidden gap-4 md:grid md:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} variant="compact" />
        ))}
      </div>
    </section>
  );
}
