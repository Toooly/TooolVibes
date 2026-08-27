"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { NormalisedTool } from "./tool-battle-shared";

type CompareEditorialDetailsProps = {
  tools: NormalisedTool[];
  layoutMode: "desktop" | "mobile";
};

type DetailRow = {
  label: string;
  value: string;
};

function buildDetailRows(tool: NormalisedTool): DetailRow[] {
  const rows: DetailRow[] = [
    { label: "Ambito principale", value: tool.categoryLabel },
    {
      label: "Casi d'uso",
      value: tool.useCases.length
        ? tool.useCases.join(" · ")
        : "Da valutare con altri dati.",
    },
    {
      label: "Punti di forza",
      value: tool.highlights.length
        ? tool.highlights.join(" · ")
        : "Non ancora pubblicati.",
    },
    {
      label: "Quando sceglierlo",
      value: tool.useCase || tool.tldr,
    },
    {
      label: "Nota decisiva",
      value: tool.review || tool.tldr,
    },
  ];

  const limitsValue = (tool as NormalisedTool & { limits?: string[] }).limits;
  if (Array.isArray(limitsValue) && limitsValue.length > 0) {
    rows.push({ label: "Limiti", value: limitsValue.join(" · ") });
  }

  rows.push({ label: "Tempo di analisi", value: tool.readingTime });

  return rows;
}

/* ---------- desktop: tabs ---------- */

function DesktopEditorialTabs({ tools }: { tools: NormalisedTool[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(
    tools[0]?.slug ?? null,
  );

  if (tools.length === 0) return null;

  return (
    <div
      className="compare-editorial-details"
      data-layout="desktop"
      role="region"
      aria-label="Dettaglio editoriale per tool"
    >
      <div
        className="compare-editorial-details__tabs"
        role="tablist"
        aria-label="Tool"
      >
        {tools.map((tool) => {
          const isActive = tool.slug === activeSlug;
          const panelId = `compare-editorial-details-panel-${tool.slug}`;
          const tabId = `compare-editorial-details-tab-${tool.slug}`;
          return (
            <button
              key={tool.slug}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveSlug(tool.slug)}
              className={cn(
                "compare-editorial-details__tab",
                isActive && "compare-editorial-details__tab--active",
              )}
            >
              {tool.name}
            </button>
          );
        })}
      </div>

      {tools.map((tool) => {
        const isActive = tool.slug === activeSlug;
        const panelId = `compare-editorial-details-panel-${tool.slug}`;
        const tabId = `compare-editorial-details-tab-${tool.slug}`;
        const rows = buildDetailRows(tool);
        return (
          <div
            key={tool.slug}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!isActive}
            className="compare-editorial-details__panel"
          >
            {rows.map((row) => (
              <div
                key={row.label}
                className="compare-editorial-details__row"
              >
                <span className="compare-editorial-details__label">
                  {row.label}
                </span>
                <span className="compare-editorial-details__value">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- mobile: accordion ---------- */

function criterionSections(tools: NormalisedTool[]) {
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const tool of tools) {
    for (const row of buildDetailRows(tool)) {
      if (seen.has(row.label)) continue;
      seen.add(row.label);
      labels.push(row.label);
    }
  }

  return labels.map((label) => ({
    label,
    rows: tools.map((tool) => {
      const match = buildDetailRows(tool).find((row) => row.label === label);
      return {
        slug: tool.slug,
        name: tool.name,
        value: match?.value ?? "",
      };
    }),
  }));
}

function criterionKey(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function MobileEditorialAccordion({ tools }: { tools: NormalisedTool[] }) {
  const sections = criterionSections(tools);
  const [openLabel, setOpenLabel] = useState<string | null>(
    sections[0]?.label ?? null,
  );

  if (tools.length === 0 || sections.length === 0) return null;

  return (
    <div
      className="compare-editorial-details compare-editorial-details--mobile"
      data-layout="mobile"
      data-accordion="criterion"
      role="region"
      aria-label="Dettaglio editoriale per criterio"
    >
      {sections.map((section) => {
        const isOpen = section.label === openLabel;
        const key = criterionKey(section.label);
        const contentId = `compare-editorial-details-mobile-${key}`;
        return (
          <section
            key={section.label}
            className="compare-editorial-details__accordion"
          >
            <button
              type="button"
              className="compare-editorial-details__accordion-summary"
              onClick={() => setOpenLabel(isOpen ? null : section.label)}
              aria-expanded={isOpen}
              aria-controls={contentId}
            >
              <span>{section.label}</span>
              <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? (
              <div
                id={contentId}
                className="compare-editorial-details__accordion-content"
              >
                {section.rows.map((row) =>
                  row.value ? (
                    <div
                      key={row.slug}
                      className="compare-editorial-details__row compare-editorial-details__row--tool"
                    >
                      <span className="compare-editorial-details__label">
                        {row.name}
                      </span>
                      <span className="compare-editorial-details__value">
                        {row.value}
                      </span>
                    </div>
                  ) : null,
                )}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

/* ---------- shared entry ---------- */

export function CompareEditorialDetails({
  tools,
  layoutMode,
}: CompareEditorialDetailsProps) {
  if (layoutMode === "mobile") {
    return <MobileEditorialAccordion tools={tools} />;
  }
  return <DesktopEditorialTabs tools={tools} />;
}
