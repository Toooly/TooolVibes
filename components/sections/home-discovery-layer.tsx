"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { ToolRecord } from "@/lib/types/tool";
import { matchesToolShortcut } from "@/lib/tools/discovery";

import { ToolCard } from "@/components/tools/tool-card";

type HomeDiscoveryLayerProps = {
  tools: ToolRecord[];
};

type ShortcutKey =
  | "all"
  | "new"
  | "featured"
  | "developer"
  | "design"
  | "assistant";

const shortcutLabels: Record<ShortcutKey, string> = {
  all: "Tutti",
  new: "Nuovi",
  featured: "In evidenza",
  developer: "Dev",
  design: "Design",
  assistant: "Assistenti AI",
};

function filterByShortcut(tool: ToolRecord, index: number, key: ShortcutKey) {
  if (key === "new") {
    return index < 6;
  }

  return matchesToolShortcut(tool, index, key);
}

export function HomeDiscoveryLayer({ tools }: HomeDiscoveryLayerProps) {
  const [shortcut, setShortcut] = useState<ShortcutKey>("all");

  const shortcutCounts = useMemo(() => {
    const entries = (Object.keys(shortcutLabels) as ShortcutKey[]).map((key) => {
      const count = tools.filter((tool, index) => filterByShortcut(tool, index, key)).length;
      return [key, count] as const;
    });

    return Object.fromEntries(entries) as Record<ShortcutKey, number>;
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool, index) => filterByShortcut(tool, index, shortcut));
  }, [shortcut, tools]);

  const leadTool = filteredTools[0] ?? null;
  const supportingTools = filteredTools.slice(1, 3);

  return (
    <section className="tone-screen page-shell home-section-gap">
      <div className="brand-panel panel-lift discovery-stage rounded-[34px] p-5 sm:p-7 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider sm:pb-6">
          <div className="max-w-[46rem]">
            <p className="editorial-label">Ingresso archivio</p>
            <h2 className="text-display-card mt-2.5 max-w-none text-[1.72rem] sm:max-w-[20ch] sm:text-[2.08rem] sm:text-balance">
              Stringi il campo e apri un solo profilo forte.
            </h2>
            <p className="text-body-soft mt-3 max-w-[38rem] text-[0.94rem] sm:text-[0.98rem]" style={{ color: "var(--muted-strong)" }}>
              La home non deve fare tutto. Qui scegli un taglio rapido, apri un candidato credibile e vai in archivio solo se ti serve davvero allargare.
            </p>
          </div>

          <div className="space-y-2 text-right">
            <span className="selection-status">{filteredTools.length} candidati</span>
            <p className="text-[0.74rem] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
              Taglio: {shortcutLabels[shortcut]}
            </p>
            <Link href="/archivio" className="section-quiet-link text-sm font-semibold" style={{ color: "var(--accent-strong)" }}>
              Apri tutto l&apos;archivio
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <div className="tool-rail -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
            {(Object.keys(shortcutLabels) as ShortcutKey[]).map((key) => {
              const active = shortcut === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setShortcut(key);
                  }}
                  className={`quick-filter-chip selection-chip text-ui-strong inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] ${
                    active ? "is-active" : ""
                  }`}
                >
                  <span>{shortcutLabels[key]}</span>
                  <span className="quick-filter-count">{shortcutCounts[key]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredTools.length === 0 ? (
          <div
            className="mt-6 rounded-[26px] border px-5 py-8 text-center"
            style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))" }}
          >
            <h3 className="text-display-card text-[1.46rem]">Qui non c&apos;e` ancora un profilo forte da aprire.</h3>
            <p className="text-body-soft mt-3 text-[0.9rem]" style={{ color: "var(--muted)" }}>
              Cambia taglio oppure passa direttamente all&apos;archivio pieno.
            </p>
            <Link
              href="/archivio"
              className="button-shell button-secondary text-ui-strong mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold"
            >
              Apri archivio
            </Link>
          </div>
        ) : (
          <div className="mt-6 editorial-grid items-start gap-y-5">
            <div className="col-span-12 xl:col-span-8">
              {leadTool ? (
                <ToolCard
                  tool={leadTool}
                  variant="featured"
                  contextLabel={shortcutLabels[shortcut]}
                />
              ) : null}
            </div>

            <div className="col-span-12 xl:col-span-4">
              <div className="space-y-3">
                <div className="metadata-block rounded-[26px] px-4.5 py-4.5">
                  <p className="brand-kicker">Passaggio corretto</p>
                  <p className="mt-2 text-[0.96rem] leading-7" style={{ color: "var(--muted-strong)" }}>
                    Se il lead regge, apri il profilo. Se il set ti sembra ancora largo, l&apos;archivio e` il posto giusto per stringere meglio.
                  </p>
                </div>

                {supportingTools.length > 0 ? (
                  <div className="grid gap-3">
                    {supportingTools.map((tool, index) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        variant="compact"
                        index={index}
                        contextLabel="Alternative vicine"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
