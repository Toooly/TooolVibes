"use client";

import { useMemo } from "react";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";

type DiscoveryProgressProps = {
  totalTools: number;
  totalCategories: number;
  featuredCount: number;
  compact?: boolean;
};

export function DiscoveryProgress({
  totalTools,
  totalCategories,
  featuredCount,
  compact = false,
}: DiscoveryProgressProps) {
  const discovery = useDiscoverySnapshot();
  const visitedCount = discovery.visitedTools.length;
  const exploredCategoriesCount = discovery.exploredCategories.length;
  const shortlistCount = discovery.shortlist.length;

  const steps = useMemo(
    () => [
      {
        title: "Scelto questa settimana",
        copy: "Parti dai tool in evidenza per entrare subito nel tono della selezione.",
        done: visitedCount > 0,
      },
      {
        title: "Nuovo in archivio",
        copy: "Apri almeno un profilo recente e lascia che l&apos;archivio ti mostri il passo successivo.",
        done: visitedCount >= 2,
      },
      {
        title: "Shortlist editoriale",
        copy: "Salva i tool da rivedere e costruisci una selezione personale leggera.",
        done: shortlistCount >= 1,
      },
    ],
    [shortlistCount, visitedCount],
  );

  const progressValue = Math.min(
    100,
    Math.round((((visitedCount > 0 ? 1 : 0) + (visitedCount >= 2 ? 1 : 0) + (shortlistCount >= 1 ? 1 : 0)) / 3) * 100),
  );

  if (compact) {
    return (
      <div className="discovery-strip rounded-[28px] px-4.5 py-4.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="editorial-label">Percorso consigliato</p>
            <p className="text-body-soft mt-2 text-[0.94rem]" style={{ color: "var(--muted-strong)" }}>
              Un percorso leggero per entrare nell&apos;archivio con più criterio.
            </p>
          </div>
          <div className="discovery-meter min-w-[11rem] rounded-[22px] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="editorial-label">Progressione</p>
              <p className="text-ui-strong text-sm" style={{ color: "var(--accent-strong)" }}>
                {progressValue}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(112,82,255,0.08)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--gold),var(--accent))] transition-all duration-500"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Tool esplorati", value: `${visitedCount}/${totalTools}` },
            { label: "Categorie", value: `${exploredCategoriesCount}/${totalCategories}` },
            { label: "Shortlist", value: `${shortlistCount}` },
          ].map((item) => (
            <div
              key={item.label}
              className="stat-block rounded-[24px] border px-4 py-3.5"
              style={{
                borderColor: "var(--line)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.84), rgba(245,240,255,0.78))",
              }}
            >
              <p className="editorial-label">{item.label}</p>
              <p className="mt-2 text-[1.25rem] leading-[1.1]">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="selection-status">Focus su {featuredCount} tool</span>
          <span className="selection-status">Shortlist editoriale</span>
          <span className="selection-status">Da tenere d&apos;occhio</span>
        </div>
      </div>
    );
  }

  return (
    <section className="page-shell home-section-gap">
      <div className="brand-panel panel-lift rounded-[34px] p-6 sm:p-7 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6 soft-divider">
          <div>
            <p className="pill">Percorso consigliato</p>
            <h2 className="text-display-card mt-3 max-w-none text-[1.7rem] sm:max-w-[15ch] sm:text-[2rem] sm:text-balance">
              Scopri l&apos;archivio come una selezione viva, non come una lista piatta.
            </h2>
          </div>
          <div className="discovery-meter min-w-[14rem] rounded-[24px] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="editorial-label">Progressione</p>
              <p className="text-ui-strong text-sm" style={{ color: "var(--accent-strong)" }}>
                {progressValue}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(112,82,255,0.08)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--gold),var(--accent))] transition-all duration-500"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 editorial-grid items-start gap-y-5">
          <div className="col-span-12 lg:col-span-5">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: "Tool esplorati", value: `${visitedCount}/${totalTools}`, note: "Profili aperti davvero" },
                {
                  label: "Categorie esplorate",
                  value: `${exploredCategoriesCount}/${totalCategories}`,
                  note: "Aree già toccate",
                },
                { label: "Shortlist salvata", value: `${shortlistCount}`, note: "Tool da rivedere" },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="stat-block rounded-[var(--radius-lg)] border px-4 py-4"
                  style={{
                    borderColor: "var(--line)",
                    background:
                      index === 2
                        ? "linear-gradient(135deg, rgba(112,82,255,0.14), rgba(255,255,255,0.78))"
                        : "linear-gradient(180deg, rgba(255,255,255,0.84), rgba(245,240,255,0.78))",
                  }}
                >
                  <p className="editorial-label">{item.label}</p>
                  <p className="mt-2 text-[1.58rem] leading-[1.1]">{item.value}</p>
                  <p className="text-body-soft mt-2 text-[0.9rem]" style={{ color: "var(--muted)" }}>
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="discovery-step interactive-surface rounded-[26px] border p-4.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="editorial-label">Step {index + 1}</p>
                      <p className="text-display-card mt-2 max-w-[11ch] text-[1.1rem]">{step.title}</p>
                    </div>
                    <span className={`step-state ${step.done ? "is-done" : ""}`}>
                      {step.done ? "Fatto" : "Aperto"}
                    </span>
                  </div>
                  <p className="text-body-soft mt-3 text-[0.92rem]" style={{ color: "var(--muted-strong)" }}>
                    {step.copy}
                  </p>
                </div>
              ))}
            </div>

            <div className="discovery-strip mt-5 rounded-[28px] px-4.5 py-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="selection-status">Da tenere d&apos;occhio</span>
                <span className="selection-status">Shortlist editoriale</span>
                <span className="selection-status">Focus su {featuredCount} tool</span>
              </div>
              <p className="text-body-soft mt-3 text-[0.92rem]" style={{ color: "var(--muted-strong)" }}>
                Apri un profilo, salva quello che vuoi rivedere e lascia che la selezione si componga da sola, un tool alla volta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
