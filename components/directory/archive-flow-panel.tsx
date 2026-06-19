"use client";

import { Layers3, Search, SlidersHorizontal, type LucideIcon } from "lucide-react";

type CatalogFlowAction = "search" | "filters" | "stack";

const catalogFlowActions: Array<{
  action: CatalogFlowAction;
  icon: LucideIcon;
  title: string;
  copy: string;
  href: string;
}> = [
  {
    action: "search",
    icon: Search,
    title: "Cerca",
    copy: "Nome, tag e casi d'uso.",
    href: "#archive-search",
  },
  {
    action: "filters",
    icon: SlidersHorizontal,
    title: "Filtra",
    copy: "Categorie prima, tag dopo.",
    href: "#archive-filters",
  },
  {
    action: "stack",
    icon: Layers3,
    title: "Costruisci",
    copy: "Salvati, confronto e lista.",
    href: "#stack-builder",
  },
];

export function ArchiveFlowPanel() {
  function triggerFlowAction(action: CatalogFlowAction, href: string) {
    window.dispatchEvent(
      new CustomEvent<CatalogFlowAction>("tooolvibes:catalog-flow", {
        detail: action,
      }),
    );
    window.history.replaceState(null, "", href);
  }

  return (
    <div className="hero-mini-visual rounded-[28px] border border-white/12 bg-white/9 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/48">
        Flusso catalogo
      </p>
      <div className="mt-4 grid gap-3">
        {catalogFlowActions.map((item) => {
          const Icon = item.icon;

          return (
            <a
              key={item.title}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                triggerFlowAction(item.action, item.href);
              }}
              className="flex items-center gap-3 rounded-[20px] border border-white/12 bg-white/8 p-3 transition hover:-translate-y-0.5 hover:border-white/24 hover:bg-white/12"
            >
              <span className="grid size-10 place-items-center rounded-[16px] bg-white/10 text-white">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">{item.title}</span>
                <span className="block text-sm text-white/56">{item.copy}</span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
