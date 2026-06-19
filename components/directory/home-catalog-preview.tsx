import Link from "next/link";
import { ArrowRight, Bookmark, GitCompare, Search, SlidersHorizontal } from "lucide-react";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

type HomeCatalogPreviewProps = {
  tools: DirectoryTool[];
};

const previewFilters = [
  { label: "Builder app", href: "/archivio?group=ai-app-builder" },
  { label: "Automazioni", href: "/archivio?group=automation" },
  { label: "Vibe coding", href: "/archivio?group=vibe-coding" },
  { label: "Video AI", href: "/archivio?group=ai-video" },
];

export function HomeCatalogPreview({ tools }: HomeCatalogPreviewProps) {
  const previewTools = tools
    .filter((tool) => tool.featured || tool.toolOfWeek)
    .slice(0, 4);

  return (
    <PremiumPanel tone="airy" className="px-4 py-5 sm:px-7 sm:py-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start">
        <div className="max-w-[39rem]">
          <PremiumBadge tone="accent">Anteprima catalogo</PremiumBadge>
          <h2 className="text-display-card mt-3 text-[1.65rem] leading-[1.1] text-white sm:mt-4 sm:text-[2.65rem]">
            Un&apos;anteprima viva, non l&apos;intero archivio messo in home.
          </h2>
          <p className="mt-3 text-[0.92rem] leading-6 text-white/68 sm:mt-4 sm:text-[1rem] sm:leading-7">
            Parti da pochi segnali forti, poi entra nel catalogo completo quando vuoi
            filtrare, salvare, confrontare e costruire la tua lista.
          </p>

          <div className="mt-5 hidden gap-2 sm:grid sm:grid-cols-2">
            {[
              { icon: Search, label: "Ricerca intelligente", copy: "Nome, tag, casi d'uso e categoria." },
              { icon: SlidersHorizontal, label: "Filtri puliti", copy: "Solo ciò che serve all'inizio." },
              { icon: GitCompare, label: "Confronto", copy: "Fino a 5 candidati alla volta." },
              { icon: Bookmark, label: "Salvati", copy: "Salva e riprendi il percorso." },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="dynamic-card rounded-[22px] border border-white/10 bg-white/7 p-4">
                  <Icon className="size-4 text-violet-100" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-white/56">{item.copy}</p>
                </div>
              );
            })}
          </div>

          <details className="micro-details mt-4 sm:hidden">
            <summary>Mostra funzioni catalogo</summary>
            <div className="mt-3 grid gap-2">
              {[
                ["Ricerca", "Nome, tag e casi d'uso."],
                ["Filtri", "Solo i segnali utili."],
                ["Confronto", "Fino a 5 candidati."],
                ["Salvati", "Salva e riprendi."],
              ].map(([label, copy]) => (
                <div key={label} className="micro-popover-panel px-3 py-2.5">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">{copy}</p>
                </div>
              ))}
            </div>
          </details>

          <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
            <PremiumLink href="/archivio">Apri catalogo</PremiumLink>
            <PremiumLink href="/shortlist#wishlist" tone="secondary">
              Suggerisci tool
            </PremiumLink>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/12 bg-white/9 p-3.5 shadow-[0_22px_58px_rgba(8,14,38,0.18)] sm:rounded-[30px] sm:p-4">
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
                  className="info-chip-button rounded-full px-3 py-1.5 text-[0.68rem] font-semibold"
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="motion-stagger mt-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {previewTools.map((tool, index) => (
              <Link
                key={tool.slug}
                href={`/toools/${tool.slug}`}
                className={`dynamic-link-card group rounded-[20px] border border-white/12 bg-white/9 p-3.5 transition duration-200 hover:-translate-y-1 hover:border-violet-200/34 hover:bg-white/14 sm:rounded-[24px] sm:p-4 ${index > 0 ? "hidden sm:block" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <DirectoryToolGlyph tool={tool} size="md" />
                  <span className="animated-status-badge rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/52">
                    #{index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-[1rem] font-semibold text-white sm:mt-4 sm:text-[1.05rem]">{tool.name}</h3>
                <p className="text-clamp-2 mt-2 text-sm leading-6 text-white/64">
                  {tool.shortDescription}
                </p>
                <div className="mt-3 rounded-[16px] border border-white/10 bg-white/8 p-3">
                   <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/44">
                    In breve
                  </p>
                  <p className="text-clamp-2 mt-1.5 text-xs leading-5 text-white/66">
                    {tool.editorialReview}
                  </p>
                </div>
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
