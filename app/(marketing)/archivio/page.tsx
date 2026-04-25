import Link from "next/link";

import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { ToolFilters } from "@/components/tools/tool-filters";
import { getAllCategories, getFeaturedTools, getPublishedTools } from "@/lib/data/public-tools";

type ArchivePageProps = {
  searchParams: Promise<{ tag?: string }>;
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const [tools, categories, featuredTools] = await Promise.all([
    getPublishedTools(),
    getAllCategories(),
    getFeaturedTools(),
  ]);
  const featuredCount = tools.filter((tool) => tool.is_featured).length;
  const archiveLeadTool = featuredTools[0] ?? tools[0] ?? null;

  return (
    <div className="tone-screen page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <section className="brand-panel brand-aura panel-lift section-stage discovery-stage relative overflow-hidden rounded-[36px] p-5 sm:p-6 lg:p-7">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_74%)]" />
        <div className="absolute -right-10 top-12 h-36 w-36 rounded-full bg-[rgba(99,50,255,0.12)] blur-3xl" />
        <div className="absolute left-8 top-16 h-[4.5rem] w-[4.5rem] rounded-full bg-[rgba(255,200,61,0.12)] blur-3xl" />
        <div className="absolute bottom-4 right-[28%] h-20 w-20 rounded-full bg-[rgba(68,220,255,0.1)] blur-3xl" />

        <div className="relative max-w-[48rem]">
          <SectionHeading
            eyebrow="Archivio TooolVibes"
            title="L'archivio dove si stringe il campo."
            description="Cerca, filtra e apri un profilo. Qui non serve altro: il compito dell'archivio e` portarti al prossimo candidato serio nel minor numero di passaggi."
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <ButtonLink href="#archivio-filtri">Vai ai filtri</ButtonLink>
            <Link href="/collections" className="section-quiet-link text-sm font-semibold" style={{ color: "var(--accent-strong)" }}>
              Se preferisci, entra da una collection
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="selection-status">{tools.length} profili</span>
            <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)", color: "var(--muted-strong)" }}>
              {categories.length} categorie
            </span>
            <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)", color: "var(--muted-strong)" }}>
              {featuredCount} in evidenza
            </span>
            {archiveLeadTool ? (
              <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)", color: "var(--muted-strong)" }}>
                Lead: {archiveLeadTool.name}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section id="archivio-filtri" className="brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
        <ToolFilters tools={tools} categories={categories} initialTag={params.tag ?? ""} />
      </section>
    </div>
  );
}
