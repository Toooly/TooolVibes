"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, Lock, Sparkles, Star } from "lucide-react";
import type { CuratedCollection } from "@/lib/types/collection";

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h % 360);
  return `hsl(${hue} 75% 60%)`;
}

function accessBadge(access: string) {
  switch (access) {
    case "premium":
      return {
        icon: Lock,
        label: "Riservata",
        tone: "var(--tv-accent-gold-on-ivory)",
        border: "color-mix(in srgb, var(--tv-accent-gold-on-ivory) 28%, transparent)",
        background: "var(--tv-accent-gold-soft-on-ivory)",
      };
    case "premium-preview":
      return {
        icon: Sparkles,
        label: "Anteprima",
        tone: "var(--tv-accent-cyan-on-ivory)",
        border: "color-mix(in srgb, var(--tv-accent-cyan-on-ivory) 28%, transparent)",
        background: "var(--tv-accent-cyan-soft-on-ivory)",
      };
    default:
      return {
        icon: Star,
        label: "Aperta",
        tone: "var(--tv-accent-violet-on-ivory)",
        border: "color-mix(in srgb, var(--tv-accent-violet-on-ivory) 28%, transparent)",
        background: "var(--tv-accent-violet-soft-on-ivory)",
      };
  }
}

function CollectionItem({ collection }: { collection: CuratedCollection }) {
  const c = hashColor(collection.slug);
  const badge = accessBadge(collection.access);
  const BadgeIcon = badge.icon;

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="mobile-collections__item"
      style={{ "--col-a": c, "--col-b": badge.tone } as CSSProperties}
    >
      <div className="mobile-collections__item-media">
        <Image
          src={collection.cover_image_url}
          alt=""
          fill
          sizes="(max-width: 767px) 6rem, 9rem"
          className="object-cover"
        />
      </div>
      <div className="mobile-collections__item-body">
        <div className="flex items-center gap-2">
          <span
            className="mobile-collections__item-badge"
            style={{ color: badge.tone, borderColor: badge.border, background: badge.background }}
          >
            <BadgeIcon className="size-3" />
            {badge.label}
          </span>
          <span className="mobile-collections__item-count">
            {collection.tool_count} tool
          </span>
        </div>
        <h3 className="mobile-collections__item-title">{collection.title}</h3>
        <p className="mobile-collections__item-desc">{collection.description}</p>
      </div>
      <ArrowRight className="mobile-collections__item-arrow" />
    </Link>
  );
}

export function MobileCollectionsView({
  collections,
  specialIssue,
  leadCollection,
}: {
  collections: CuratedCollection[];
  specialIssue: CuratedCollection | null;
  leadCollection: CuratedCollection | null;
}) {
  const main = specialIssue ?? leadCollection ?? null;
  const others = collections.filter(
    (c) => c.slug !== main?.slug,
  );

  return (
    <div className="mobile-collections">
      <header className="mobile-collections__header">
        <div className="mobile-collections__badge">
          <Boxes className="size-4" />
          <span>Selezioni</span>
        </div>
        <h1>Il posto dove la selezione diventa percorso.</h1>
        <p>
          Entra da uno scenario, una tesi o un pubblico già ordinati. Nessun filtro da costruire: il percorso è già pronto.
        </p>
        <div className="mobile-collections__stats">
          <span>
            {collections.length} {collections.length === 1 ? "raccolta" : "raccolte"}
          </span>
          <span>/</span>
          <span>{specialIssue ? "1 raccolta speciale" : "Nessuna raccolta speciale"}</span>
        </div>
      </header>

      {/* Main feature */}
      {main && (
        <section
          className="mobile-collections__hero"
          style={{ "--hero-a": hashColor(main.slug) } as CSSProperties}
        >
          <div className="mobile-collections__hero-inner">
            <div className="flex flex-wrap items-center gap-2">
              {specialIssue ? (
                <span className="mobile-collections__hero-tag mobile-collections__hero-tag--special">
                  <Sparkles className="size-3" />
                  Speciale
                </span>
              ) : (
                <span className="mobile-collections__hero-tag mobile-collections__hero-tag--featured">
                  <Star className="size-3" />
                  In vetrina
                </span>
              )}
              <span className="mobile-collections__hero-count">
                {main.tool_count} tool
              </span>
            </div>
            <h2 className="mobile-collections__hero-title">{main.title}</h2>
            <p className="mobile-collections__hero-desc">{main.description}</p>
            {main.highlights.length > 0 && (
              <div className="mobile-collections__hero-highlights">
                {main.highlights.slice(0, 3).map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
            )}
            <Link
              href={`/collections/${main.slug}`}
              className="mobile-collections__hero-cta"
            >
              {specialIssue ? "Apri raccolta speciale" : "Apri raccolta"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mobile-collections__hero-media">
            <Image
              src={main.cover_image_url}
              alt={main.title}
              fill
              priority
              sizes="(max-width: 767px) 100vw, 44vw"
              className="object-cover"
            />
          </div>
        </section>
      )}

      {/* Others list */}
      {others.length > 0 && (
        <section className="mobile-collections__list">
          <p className="mobile-collections__list-label">
            {specialIssue ? "Altre raccolte" : "Tutte le raccolte"}
          </p>
          <div className="mobile-collections__list-grid">
            {others.map((c) => (
              <CollectionItem key={c.slug} collection={c} />
            ))}
          </div>
        </section>
      )}

      <div className="mobile-collections__footer">
        <Link href="/archivio" className="mobile-collections__footer-link">
          Esplora l&apos;archivio
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
