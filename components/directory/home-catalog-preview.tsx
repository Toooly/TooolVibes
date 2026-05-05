import Link from "next/link";
import { ArrowRight, Bookmark, GitCompare, Search, SlidersHorizontal } from "lucide-react";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

type HomeCatalogPreviewProps = {
  tools: DirectoryTool[];
};

const previewFilters = [
  { label: "App builder", href: "/archivio?group=ai-app-builder" },
  { label: "Automation", href: "/archivio?group=automation" },
  { label: "Vibe coding", href: "/archivio?group=vibe-coding" },
  { label: "AI Video", href: "/archivio?group=ai-video" },
];

export function HomeCatalogPreview({ tools }: HomeCatalogPreviewProps) {
  const previewTools = tools
    .filter((tool) => tool.featured || tool.toolOfWeek)
    .slice(0, 4);

  return (
    <PremiumPanel tone="airy" className="px-5 py-6 sm:px-7 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start">
        <div className="max-w-[39rem]">
          <PremiumBadge tone="accent">Catalogo preview</PremiumBadge>
          <h2 className="text-display-card mt-4 text-[2rem] leading-[1.02] text-white sm:text-[2.65rem]">
            Una preview editoriale, non tutto l&apos;archivio in home.
          </h2>
          <p className="mt-4 text-[1rem] leading-7 text-white/68">
            Parti da pochi segnali forti, poi apri il catalogo completo quando vuoi
            filtrare, salvare, confrontare e costruire il tuo stack.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              { icon: Search, label: "Ricerca semantica", copy: "Nome, tag, use case e categoria." },
              { icon: SlidersHorizontal, label: "Filtri puliti", copy: "Solo ciò che serve all'inizio." },
              { icon: GitCompare, label: "Confronto", copy: "Fino a 4 candidati alla volta." },
              { icon: Bookmark, label: "Shortlist", copy: "Salva e riprendi il percorso." },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/7 p-4">
                  <Icon className="size-4 text-violet-100" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-white/56">{item.copy}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <PremiumLink href="/archivio">Apri catalogo</PremiumLink>
            <PremiumLink href="/wishlist" tone="secondary">
              Suggerisci tool
            </PremiumLink>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/12 bg-white/9 p-4 shadow-[0_22px_58px_rgba(8,14,38,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/48">
                Scorciatoie
              </p>
              <p className="mt-1 text-sm text-white/68">
                Scegli un ingresso, poi affina nel catalogo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {previewFilters.map((filter) => (
                <Link
                  key={filter.href}
                  href={filter.href}
                  className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[0.68rem] font-semibold text-white/68 transition hover:border-white/22 hover:bg-white/12 hover:text-white"
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="motion-stagger mt-4 grid gap-3 sm:grid-cols-2">
            {previewTools.map((tool, index) => (
              <Link
                key={tool.slug}
                href={`/toools/${tool.slug}`}
                className="group rounded-[24px] border border-white/12 bg-white/9 p-4 transition duration-200 hover:-translate-y-1 hover:border-violet-200/34 hover:bg-white/14"
              >
                <div className="flex items-start justify-between gap-3">
                  <DirectoryToolGlyph tool={tool} size="md" />
                  <span className="rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/52">
                    #{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-[1.05rem] font-semibold text-white">{tool.name}</h3>
                <p className="text-clamp-2 mt-2 text-sm leading-6 text-white/64">
                  {tool.shortDescription}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-100">
                  Apri scheda
                  <ArrowRight className="size-3.5 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PremiumPanel>
  );
}
