"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { ToolRecord } from "@/lib/types/tool";
import { getToolBestFor, getToolEditorialNote, getToolPricing } from "@/lib/tools/discovery";

import { ToolCard } from "@/components/tools/tool-card";
import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";

type EditorialSelectionProps = {
  tools: ToolRecord[];
};

export function EditorialSelection({ tools }: EditorialSelectionProps) {
  const rationalePoints = [
    "La curation guarda al prodotto intero, non solo alle feature.",
    "Un tool entra qui se ha uso chiaro, tono coerente e presenza memorabile.",
  ];
  const compareTools = tools.slice(0, 4);
  const [selectedSlug, setSelectedSlug] = useState(compareTools[0]?.slug ?? "");
  const selectedTool = useMemo(
    () => compareTools.find((tool) => tool.slug === selectedSlug) ?? compareTools[0] ?? null,
    [compareTools, selectedSlug],
  );

  return (
    <section className="page-shell">
      <div className="brand-panel panel-lift rounded-[34px] p-6 sm:p-7 lg:p-8">
        <div className="editorial-grid items-start gap-y-5">
          <div className="col-span-12 lg:col-span-4">
            <SectionHeading
              eyebrow="Razionale editoriale"
              title="Perch&eacute; alcuni tool restano, e altri no."
              description="La selezione TooolVibes filtra per utilit&agrave;, tono, chiarezza di posizionamento e qualit&agrave; dell&apos;esperienza."
            />
            <div className="mt-5 grid gap-3">
              {rationalePoints.map((point) => (
                <div key={point} className="metadata-block rounded-[var(--radius-lg)] px-4 py-4">
                  <p className="text-body-soft text-[0.94rem]" style={{ color: "var(--muted-strong)" }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8">
            {compareTools.length > 0 ? (
              <div className="mini-compare-shell space-y-4 rounded-[30px] border p-4 sm:p-5" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(244,239,255,0.66))" }}>
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="editorial-label">Mini compare</p>
                    <h3 className="text-display-card mt-2 text-[1.48rem] sm:text-[1.72rem] sm:text-balance">
                      Quick scan pulito, poi profilo e confronto vero.
                    </h3>
                  </div>
                  {selectedTool ? <span className="selection-status">{selectedTool.name} in focus</span> : null}
                </div>

                <div className="tool-rail -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 md:hidden">
                  {compareTools.map((tool, index) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      variant="scan"
                      index={index}
                      contextLabel="Mini compare"
                      selected={selectedSlug === tool.slug}
                      onSelect={setSelectedSlug}
                      swipeFriendly
                    />
                  ))}
                </div>

                <div className="hidden gap-4 md:grid md:grid-cols-2">
                  {compareTools.map((tool, index) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      variant="scan"
                      index={index}
                      contextLabel="Mini compare"
                      selected={selectedSlug === tool.slug}
                      onSelect={setSelectedSlug}
                    />
                  ))}
                </div>

                {selectedTool ? (
                  <div className="mini-compare-focus rounded-[28px] px-4.5 py-4.5 sm:px-5 sm:py-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-[34rem]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="selection-chip rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white" style={{ borderColor: "rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.1)" }}>
                            Profilo in focus
                          </span>
                          <span className="selection-chip rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "rgba(255,255,255,0.18)", background: "rgba(249,239,212,0.92)", color: "var(--muted-strong)" }}>
                            {getToolPricing(selectedTool)}
                          </span>
                        </div>
                        <h4 className="text-display-card mt-3 text-[1.54rem] text-white sm:max-w-[18ch]">
                          {selectedTool.name}
                        </h4>
                        <p className="mt-3 text-[0.95rem] leading-7 text-white/84">
                          {getToolBestFor(selectedTool)}
                        </p>
                        <p className="mt-2 text-[0.88rem] leading-6 text-white/66">
                          {getToolEditorialNote(selectedTool)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <ButtonLink href={`/toools/${selectedTool.slug}`} className="min-w-0 px-4 py-2.5">
                          Apri profilo
                        </ButtonLink>
                        <ButtonLink href="/compare" variant="secondary" className="min-w-0 px-4 py-2.5">
                          Apri compare
                        </ButtonLink>
                        <Link href="/shortlist" className="section-quiet-link text-sm font-semibold text-white/82">
                          Shortlist
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                className="rounded-[var(--radius-lg)] border px-6 py-10 text-center"
                style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(243,237,255,0.7))" }}
              >
                <h3 className="text-2xl">Il mini compare arriver&agrave; qui.</h3>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
                  Pubblica almeno due tool per attivare questa vista comparativa.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
