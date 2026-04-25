import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrackToolVisit } from "@/components/discovery/track-tool-visit";
import { SectionHeading } from "@/components/sections/section-heading";
import { CompareToggle } from "@/components/tools/compare-toggle";
import { EditorialScorecard } from "@/components/tools/editorial-scorecard";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import { TagPill } from "@/components/tools/tag-pill";
import { ToolGrid } from "@/components/tools/tool-grid";
import { ToolWorkspacePanel } from "@/components/tools/tool-workspace-panel";
import { getCollectionAccessMeta } from "@/lib/collections/helpers";
import { marketingStrings } from "@/lib/config/strings";
import { siteConfig } from "@/lib/config/site";
import { getEditorialPostByToolSlug } from "@/lib/data/public-articles";
import { getCollectionsByToolSlug } from "@/lib/data/public-collections";
import { getPublishedTools, getToolBySlug } from "@/lib/data/public-tools";
import { resolveCollectionPremiumAccess } from "@/lib/premium/access";
import {
  getRelatedTools,
  getToolBestFor,
  getToolCautions,
  getToolEditorialNote,
  getToolEditorialState,
  getToolPlatforms,
  getToolPricing,
  getToolStrengths,
  getToolUseCases,
  getToolWhyHere,
} from "@/lib/tools/discovery";
import { formatItalianDate } from "@/lib/utils";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    return {};
  }

  return {
    title: tool.name,
    description: tool.short_description_it,
    openGraph: {
      title: `${tool.name} | ${siteConfig.name}`,
      description: tool.short_description_it,
      images: [tool.cover_image_url],
    },
  };
}

export default async function ToolDetailPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const [allTools, relatedCollections, editorialPost] = await Promise.all([
    getPublishedTools(),
    getCollectionsByToolSlug(slug),
    getEditorialPostByToolSlug(slug),
  ]);
  const editorialIndex = Math.max(
    allTools.findIndex((item) => item.slug === tool.slug),
    0,
  );
  const relatedTools = getRelatedTools(tool, allTools, 4);

  const editorialState = getToolEditorialState(tool, editorialIndex);
  const pricing = getToolPricing(tool);
  const platforms = getToolPlatforms(tool);
  const bestFor = getToolBestFor(tool);
  const editorialNote = getToolEditorialNote(tool);
  const whyHere = getToolWhyHere(tool);
  const useCases = getToolUseCases(tool);
  const strengths = getToolStrengths(tool);
  const cautions = getToolCautions(tool);

  const editorialSignals = [
    { label: "Stato editoriale", value: editorialState },
    { label: "Pricing", value: pricing },
    { label: "Scoperto il", value: formatItalianDate(tool.date_discovered) },
  ];
  const leadCollection = relatedCollections[0] ?? null;

  return (
    <div className="tone-decision page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <TrackToolVisit slug={tool.slug} category={tool.category} />

      <section className="brand-panel brand-aura panel-lift section-stage group relative overflow-hidden rounded-[36px]">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_74%)]" />
        <div className="absolute right-0 top-8 h-44 w-44 rounded-full bg-[rgba(99,50,255,0.12)] blur-3xl" />
        <div className="absolute bottom-6 left-[42%] h-20 w-20 rounded-full bg-[rgba(68,220,255,0.1)] blur-3xl" />

        <div className="editorial-grid relative gap-y-0">
          <div className="col-span-12 p-5 sm:p-6 lg:col-span-7 lg:p-7">
            <div className="text-meta flex flex-wrap items-center gap-3 text-[0.92rem]" style={{ color: "var(--muted)" }}>
              <Link href="/archivio" className="section-quiet-link">
                Archivio dei Toools
              </Link>
              <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
              <span>{tool.category}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="pill selection-chip">{tool.category}</p>
              <span
                className="selection-chip rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                style={{ background: "rgba(249,239,212,0.96)", color: "var(--muted-strong)" }}
              >
                {editorialState}
              </span>
              {tool.is_featured ? <span className="selection-status">In evidenza</span> : null}
            </div>

            <p className="mt-6 brand-kicker">Scheda decisionale</p>
            <h1 className="text-display-hero mt-2.5 max-w-none text-[2.44rem] sm:max-w-[12.5ch] sm:text-[3.02rem] sm:text-balance lg:max-w-[13ch] lg:text-[3.66rem]">
              {tool.name}
            </h1>
            <p className="text-body-soft mt-4.5 max-w-[45rem] text-[0.98rem] sm:text-[1.04rem]" style={{ color: "var(--muted-strong)" }}>
              {tool.short_description_it}
            </p>

            <div className="metadata-block mt-4.5 rounded-[24px] px-4.5 py-4">
              <p className="brand-kicker">In breve</p>
              <p className="text-body-strong mt-2.5 text-[0.98rem] sm:text-[1.02rem]" style={{ color: "var(--muted-strong)" }}>
                {whyHere}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <ShortlistToggle slug={tool.slug} />
              <CompareToggle slug={tool.slug} />
            </div>
            <p className="mt-3 text-[0.88rem] leading-6" style={{ color: "var(--muted)" }}>
              {leadCollection
                ? "Se regge il primo filtro, il passo naturale dopo questo profilo e` la collection collegata."
                : "Se regge il primo filtro, portalo in shortlist e lascia che il compare entri solo piu` tardi."}
            </p>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="relative h-full min-h-[22rem] overflow-hidden lg:min-h-[100%]">
              <Image
                src={tool.cover_image_url}
                alt={tool.name}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="image-float object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,17,12,0.08),rgba(26,20,64,0.58))]" />
              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <span
                  className="selection-chip rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white"
                  style={{ borderColor: "rgba(255,255,255,0.22)", background: "rgba(24,17,12,0.28)" }}
                >
                  Profilo tool
                </span>
              </div>

              <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-white/74">
                  Decisione rapida
                </p>
                <p className="text-display-card mt-2 max-w-none text-[1.54rem] text-white sm:max-w-[11.5ch] sm:text-[1.78rem] sm:text-balance">
                  {tool.name}
                </p>
                <p className="mt-3 text-[0.9rem] leading-6 text-white/76">
                  {editorialState} · {pricing}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-grid gap-y-4">
        <div className="col-span-12 lg:col-span-7">
          <div className="brand-panel panel-lift rounded-[32px] p-5 sm:p-6">
            <SectionHeading
              eyebrow="Lettura decisionale"
              title="Capisci in fretta se questo tool entra davvero nel tuo stack."
              description="Qui restano solo i segnali che servono a salvarlo, confrontarlo o lasciarlo andare."
            />

            <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
              <div className="stat-block rounded-[24px] border p-4" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))" }}>
                <p className="editorial-label">Uso ideale</p>
                <p className="text-body-strong mt-2.5 text-[0.98rem]">{bestFor}</p>
              </div>
              <div className="stat-block rounded-[24px] border p-4" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))" }}>
                <p className="editorial-label">Posizionamento</p>
                <p className="text-body-strong mt-2.5 text-[0.98rem]">
                  {tool.category} con supporto {platforms.join(", ").toLowerCase()} e un taglio utile quando devi pesare fit, focus e maturita` prima del prossimo click.
                </p>
              </div>
            </div>

            <EditorialScorecard
              tool={tool}
              variant="detail"
              showHeading={false}
              className="mt-5"
            />

            <div className="metadata-block mt-5 rounded-[26px] px-5 py-4.5">
              <p className="brand-kicker">Punto di vista TooolVibes</p>
              <p className="text-body-soft mt-2.5 text-[0.98rem]" style={{ color: "var(--muted-strong)" }}>
                {editorialNote}
              </p>
            </div>

            <div className="mt-5 grid gap-3.5 lg:grid-cols-2">
              <div className="metadata-block rounded-[24px] px-5 py-4.5">
                <p className="editorial-label">Use case principali</p>
                <div className="mt-4 grid gap-3">
                  {useCases.map((item, index) => (
                    <div
                      key={item}
                      className="stat-block rounded-[20px] border px-4 py-3.5"
                      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.56)" }}
                    >
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="text-body-strong mt-2 text-[0.95rem]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="metadata-block rounded-[24px] px-5 py-4.5">
                <p className="editorial-label">Punti forti</p>
                <div className="mt-4 grid gap-3">
                  {strengths.map((item) => (
                    <div
                      key={item}
                      className="stat-block rounded-[20px] border px-4 py-3.5"
                      style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.56)" }}
                    >
                      <p className="text-body-strong text-[0.95rem]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="mt-5 rounded-[26px] border px-5 py-5"
              style={{
                borderColor: "rgba(212,177,101,0.28)",
                background: "linear-gradient(180deg, rgba(255,249,240,0.96), rgba(249,239,212,0.74))",
              }}
            >
              <p className="brand-kicker">Limiti / attenzione</p>
              <div className="mt-3 grid gap-3">
                {cautions.map((item) => (
                  <div
                    key={item}
                    className="rounded-[20px] border px-4 py-3.5"
                    style={{ borderColor: "rgba(212,177,101,0.22)", background: "rgba(255,255,255,0.56)" }}
                  >
                    <p className="text-body-strong text-[0.95rem]" style={{ color: "var(--muted-strong)" }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="space-y-3 lg:sticky lg:top-28">
            <div className="dark-panel panel-lift rounded-[28px] p-4 sm:p-5">
              <p className="editorial-label !text-white/60">Segnali da leggere subito</p>
              <p className="text-display-card mt-3 max-w-none text-[1.5rem] text-white sm:max-w-[16ch] sm:text-balance">
                Prima guarda stato, best for e workflow fit.
              </p>
              <div className="mt-5 grid gap-3">
                {editorialSignals.map((item) => (
                  <div
                    key={item.label}
                    className="discovery-strip-dark rounded-[22px] px-4 py-4"
                  >
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                      {item.label}
                    </p>
                    <p className="text-meta mt-2 text-[0.96rem] text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <EditorialScorecard
                  tool={tool}
                  variant="compact"
                  tone="dark"
                  limit={3}
                  heading="Scorecard curatoriale"
                  description="Leggila come una firma decisionale: non misura tutto, ma ti dice dove il tool regge davvero."
                />
              </div>
            </div>

            <ToolWorkspacePanel tool={tool} />

            {(editorialPost || leadCollection || tool.website_url) ? (
              <div className="brand-panel panel-lift rounded-[28px] p-4 sm:p-4.5">
              <p className="editorial-label">Dopo questo profilo</p>
              <div className="mt-4 grid gap-3">
                {leadCollection ? (
                    <Link
                      href={`/collections/${leadCollection.slug}`}
                      className="metadata-block rounded-[22px] px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <p className="editorial-label">Collection collegata</p>
                      <p className="text-display-card mt-2 text-[1.08rem]">{leadCollection.title}</p>
                      <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                        Riportalo in un percorso piu` guidato.
                      </p>
                    </Link>
                  ) : null}
                  {editorialPost ? (
                    <Link
                      href={`/posts/${editorialPost.slug}`}
                      className="metadata-block rounded-[22px] px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <p className="editorial-label">{marketingStrings.detail.article}</p>
                      <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                        Aprilo solo dopo aver capito se il tool regge davvero il primo filtro.
                      </p>
                    </Link>
                  ) : null}
                </div>
                <Link
                  href={tool.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="section-quiet-link mt-4 inline-flex text-sm font-semibold"
                  style={{ color: "var(--muted)" }}
                >
                  {marketingStrings.detail.website}
                </Link>
              </div>
            ) : null}

            <div className="brand-panel panel-lift rounded-[28px] p-4 sm:p-4.5">
              <p className="editorial-label">Tag editoriali</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tool.tags.map((tag) => (
                  <TagPill key={tag} tag={tag} />
                ))}
              </div>
              <div className="metadata-block mt-4 rounded-[22px] px-4 py-3.5">
                <p className="editorial-label">Fonte</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                  {tool.source}
                </p>
              </div>
            </div>

            {relatedCollections.length > 0 ? (
              <div className="brand-panel panel-lift rounded-[28px] p-4 sm:p-4.5">
                <p className="editorial-label">Fa parte di</p>
              <div className="mt-4 grid gap-3">
                  {relatedCollections.slice(0, 2).map((collection) => {
                    const access = getCollectionAccessMeta(collection.access);
                    const premiumAccess = resolveCollectionPremiumAccess(collection.access, {
                      surface: collection.surface,
                    });

                    return (
                      <Link
                        key={collection.id}
                        href={`/collections/${collection.slug}`}
                        className="metadata-block rounded-[22px] px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="editorial-label">{collection.cover_kicker}</p>
                          <span
                            className="selection-chip rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
                            style={{
                              borderColor: "var(--line)",
                              background:
                                collection.access === "open"
                                  ? "rgba(255,255,255,0.78)"
                                  : "rgba(249,239,212,0.92)",
                              color: "var(--muted-strong)",
                            }}
                          >
                            {premiumAccess.subtle_label}
                          </span>
                        </div>
                        <p className="text-display-card mt-2 text-[1.12rem]">{collection.title}</p>
                        <p className="mt-2 hidden text-sm leading-6 sm:block" style={{ color: "var(--muted-strong)" }}>
                          {collection.description}
                        </p>
                        <p className="mt-3 text-[0.72rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                          {collection.tool_count} tool · {access.label}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {relatedTools.length > 0 ? (
        <section className="brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
          <SectionHeading
            eyebrow="Alternative correlate"
            title="Se questo profilo tiene, questi sono i confronti piu` naturali da aprire dopo."
            description="I correlati non sono casuali: arrivano da categoria condivisa, tag vicini e compatibilita` di lettura."
          />
          <div className="mt-6">
            <ToolGrid tools={relatedTools} contextLabel="Correlati editoriali" variant="compact" mobileSwipe />
          </div>
        </section>
      ) : null}
    </div>
  );
}
