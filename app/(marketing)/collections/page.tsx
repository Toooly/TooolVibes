import Image from "next/image";
import Link from "next/link";

import { CollectionCard } from "@/components/collections/collection-card";
import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";
import {
  getCuratedCollections,
  getFeaturedCollections,
  getFeaturedSpecialIssue,
  getPremiumCollections,
  getPremiumPreviewCollections,
} from "@/lib/data/public-collections";
import { getCollectionFormatMeta, hasAdvancedSpecialIssue } from "@/lib/collections/format";
import { getCollectionAccessMeta } from "@/lib/collections/helpers";
import { resolveCollectionPremiumAccess } from "@/lib/premium/access";

export default async function CollectionsPage() {
  const [collections, featuredCollections, specialIssue, premiumCollections, premiumPreviewCollections] = await Promise.all([
    getCuratedCollections(),
    getFeaturedCollections(),
    getFeaturedSpecialIssue(),
    getPremiumCollections(),
    getPremiumPreviewCollections(),
  ]);

  const leadCollection =
    featuredCollections.find((collection) => collection.slug !== specialIssue?.slug) ??
    collections.find((collection) => collection.slug !== specialIssue?.slug) ??
    specialIssue ??
    null;

  const remainingCollections = collections.filter(
    (collection) =>
      collection.slug !== leadCollection?.slug && collection.slug !== specialIssue?.slug,
  );

  const specialIssueAccess = specialIssue ? getCollectionAccessMeta(specialIssue.access) : null;
  const specialIssuePremium = specialIssue
    ? resolveCollectionPremiumAccess(specialIssue.access, { surface: specialIssue.surface })
    : null;
  const specialIssueFormat = specialIssue ? getCollectionFormatMeta(specialIssue) : null;
  const memberIssueCount = premiumCollections.filter(
    (collection) => collection.access === "premium",
  ).length;
  const previewCount = premiumPreviewCollections.length;

  return (
    <div className="tone-curate page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <section className="brand-panel brand-aura panel-lift section-stage curation-stage relative overflow-hidden rounded-[36px] p-5 sm:p-6 lg:p-7">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_74%)]" />
        <div className="absolute -right-10 top-12 h-36 w-36 rounded-full bg-[rgba(99,50,255,0.12)] blur-3xl" />
        <div className="absolute left-8 top-16 h-[4.5rem] w-[4.5rem] rounded-full bg-[rgba(255,200,61,0.12)] blur-3xl" />
        <div className="absolute bottom-4 right-[28%] h-20 w-20 rounded-full bg-[rgba(68,220,255,0.1)] blur-3xl" />

        <div className="relative max-w-[50rem]">
          <SectionHeading
            eyebrow="Collections"
            title="La superficie dove la selezione diventa percorso."
            description="Qui non stai più partendo da un nome o da un filtro. Stai entrando da uno scenario, una tesi o un pubblico già ordinati."
          />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ButtonLink href={leadCollection ? `/collections/${leadCollection.slug}` : "/archivio"}>
              {leadCollection ? "Apri la collection guida" : "Apri l'archivio"}
            </ButtonLink>
            <Link
              href="/archivio"
              className="section-quiet-link text-sm font-semibold"
              style={{ color: "var(--accent-strong)" }}
            >
              Torna all&apos;archivio
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="selection-status">{collections.length} collection attive</span>
            <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)", color: "var(--muted-strong)" }}>
              {featuredCollections.length} in evidenza
            </span>
            <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)", color: "var(--muted-strong)" }}>
              {previewCount} preview · {memberIssueCount} member
            </span>
          </div>
        </div>
      </section>

      {specialIssue ? (
        <section className="tone-issue dark-panel panel-lift issue-stage relative overflow-hidden rounded-[36px]">
          <div className="editorial-grid gap-y-0">
            <div className="col-span-12 p-5 sm:p-6 lg:col-span-7 lg:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill !bg-white/12 !text-white">Special issue</span>
                <span className="selection-chip rounded-full border border-white/14 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/82">
                  {specialIssueAccess?.label}
                </span>
                <span className="selection-chip rounded-full border border-white/14 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/82">
                  {specialIssueFormat?.label}
                </span>
              </div>

              <p className="mt-5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/56">
                {hasAdvancedSpecialIssue(specialIssue) ? "Issue avanzata" : "Special issue editoriale"}
              </p>
              <h2 className="text-display-hero mt-3 max-w-none text-[2.02rem] text-white sm:max-w-[14ch] sm:text-[2.76rem] sm:text-balance">
                {specialIssue.title}
              </h2>
              <p className="mt-4 max-w-[44rem] text-[0.98rem] leading-7 text-white/78">
                {specialIssue.description}
              </p>
              {specialIssue.advanced_issue ? (
                <div className="mt-5 rounded-[24px] border border-white/12 bg-white/6 px-4 py-4">
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                    Flusso di lettura
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/82">
                    {specialIssue.advanced_issue.reading_flow}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {specialIssue.highlights.slice(0, 4).map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-6 text-white/82"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <ButtonLink href={`/collections/${specialIssue.slug}`}>
                  {specialIssuePremium?.entry_label ?? "Apri special issue"}
                </ButtonLink>
                {specialIssuePremium &&
                specialIssuePremium.state !== "open" &&
                specialIssuePremium.state !== "unlocked" ? (
                  <Link
                    href="/account#member-access"
                    className="section-quiet-link text-sm font-semibold"
                    style={{ color: "white" }}
                  >
                    Capisci il member layer
                  </Link>
                ) : (
                  <Link
                    href="/shortlist"
                    className="section-quiet-link text-sm font-semibold"
                    style={{ color: "white" }}
                  >
                    Porta i tool in shortlist
                  </Link>
                )}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <div className="relative h-full min-h-[21rem] overflow-hidden lg:min-h-[100%]">
                <Image
                  src={specialIssue.cover_image_url}
                  alt={specialIssue.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="image-float object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,35,0.06),rgba(18,15,35,0.72))]" />
                <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-white/12 bg-[linear-gradient(135deg,rgba(24,18,54,0.88),rgba(38,31,82,0.76))] px-4 py-4">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                    Perché conta
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/82">{specialIssue.rationale}</p>
                  {specialIssue.premium_teaser ? (
                    <p className="mt-3 text-[0.82rem] leading-6 text-white/66">
                      {specialIssue.premium_teaser}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {leadCollection ? <CollectionCard collection={leadCollection} variant="featured" /> : null}

      {remainingCollections.length > 0 ? (
        <section className="brand-panel panel-lift curation-stage rounded-[34px] p-5 sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider">
            <div className="max-w-[42rem]">
              <p className="editorial-label">Collection pubblicate</p>
              <h2 className="text-display-card mt-2.5 max-w-none text-[1.62rem] sm:max-w-[17ch] sm:text-[1.9rem] sm:text-balance">
                Percorsi più stretti, più leggibili, più pronti da usare.
              </h2>
            </div>
            <span className="selection-status">Collection attive</span>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {remainingCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} variant="standard" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
