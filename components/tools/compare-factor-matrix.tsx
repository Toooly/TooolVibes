"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCompareObjectiveLabel,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import { MIN_COMPARE_TOOLS } from "@/lib/stores/tool-workspace-store";
import {
  getBattleVerdict,
  type NormalisedTool,
  type BattleVerdict,
} from "./tool-battle-shared";

type LayoutMode = "desktop" | "mobile";

type CompareFactorMatrixProps = {
  tools: NormalisedTool[];
  objective?: CompareObjective | null;
  verdict?: BattleVerdict | null;
  layoutMode: LayoutMode;
};

/* ---------- desktop matrix: one row per factor ---------- */

function DesktopFactorMatrix({
  tools,
  objective,
  verdict: suppliedVerdict,
}: {
  tools: NormalisedTool[];
  objective: CompareObjective | null;
  verdict: BattleVerdict | null;
}) {
  const cellsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isSyncing = useRef(false);
  const headWrapRef = useRef<HTMLDivElement | null>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = headWrapRef.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [tools.length]);

  const verdict = useMemo(
    () => suppliedVerdict ?? getBattleVerdict(tools, objective),
    [tools, objective, suppliedVerdict],
  );
  const rankBySlug = useMemo(
    () => new Map(verdict.scores.map(({ tool, rank }) => [tool.slug, rank])),
    [verdict],
  );
  const scoreBySlug = useMemo(
    () => new Map(verdict.scores.map(({ tool, score }) => [tool.slug, score])),
    [verdict],
  );
  const [diffOnly, setDiffOnly] = useState(false);
  const factors = useMemo(() => {
    const all = tools.flatMap((t) => t.weightedDimensions ?? []);
    const seen = new Set<string>();
    const result: {
      key: string;
      label: string;
      weight: number;
      isPrimary: boolean;
    }[] = [];
    for (const dim of all) {
      if (!seen.has(dim.key)) {
        seen.add(dim.key);
        result.push({
          key: dim.key,
          label: dim.label,
          weight: dim.weight,
          isPrimary: dim.isPrimary,
        });
      }
    }
    return result;
  }, [tools]);
  const visibleFactors = useMemo(() => {
    if (!diffOnly) return factors;
    return factors.filter((factor) => {
      const values = tools.map(
        (tool) =>
          tool.weightedDimensions?.find((dim) => dim.key === factor.key)?.value ??
          null,
      );
      return new Set(values.map(String)).size > 1;
    });
  }, [diffOnly, factors, tools]);

  if (tools.length < MIN_COMPARE_TOOLS) return null;

  const handleScroll = (index: number) => {
    if (isSyncing.current) return;
    const source = cellsRef.current[index];
    if (!source) return;
    isSyncing.current = true;
    cellsRef.current.forEach((el, i) => {
      if (el && i !== index) {
        el.scrollLeft = source.scrollLeft;
      }
    });
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  return (
    <section
      className="compare-factor-matrix"
      data-layout="desktop"
      data-count={tools.length}
      style={{ "--tool-count": tools.length } as CSSProperties}
    >
      <div className="compare-factor-matrix__header">
        <Scale className="size-4" aria-hidden="true" />
        <div>
          <span><LocalizedText>{"Fattori per l'obiettivo"}</LocalizedText></span>
          <small><LocalizedText>{"Una riga per ogni dimensione decisionale."}</LocalizedText></small>
        </div>
        <LocalizedAttributes><div className="compare-factor-matrix__mode" role="group" aria-label="Visibilità fattori">
          <button
            type="button"
            className="compare-factor-matrix__mode-btn"
            aria-pressed={!diffOnly}
            onClick={() => setDiffOnly(false)}
          ><LocalizedText>{"Tutto "}</LocalizedText></button>
          <button
            type="button"
            className="compare-factor-matrix__mode-btn"
            aria-pressed={diffOnly}
            onClick={() => setDiffOnly(true)}
          ><LocalizedText>{"Solo differenze "}</LocalizedText></button>
        </div></LocalizedAttributes>
      </div>

      <div className="compare-factor-matrix__head" aria-hidden="false">
        <div className="compare-factor-matrix__axis compare-factor-matrix__axis--head">
          <span><LocalizedText>{"Fattore"}</LocalizedText></span>
          <small><LocalizedText>{"peso e spiegazione"}</LocalizedText></small>
        </div>
        <LocalizedAttributes><div
          className="compare-factor-matrix__scroll-wrap"
          tabIndex={0}
          aria-label="Tool confrontati"
          ref={(el) => {
            headWrapRef.current = el;
            if (el) cellsRef.current.push(el);
          }}
          onScroll={() => handleScroll(tools.length + 6)}
        >
          {canScroll ? (
            <div
              className="compare-factor-matrix__scroll-hint"
              aria-hidden="true"
            >
              <ArrowRight size={14} />
            </div>
          ) : null}
          <div className="compare-factor-matrix__grid">
            {tools.map((tool) => (
              <div
                key={tool.slug}
                className="compare-factor-matrix__cell compare-factor-matrix__cell--head"
                style={
                  {
                    "--arena-a": tool.accentFrom,
                    "--arena-b": tool.accentTo,
                  } as CSSProperties
                }
              >
                <span className="compare-factor-matrix__tool">{tool.name}</span>
                <span className="compare-factor-matrix__tool-score">
                  <LocalizedText>{rankBySlug.get(tool.slug) === null ||
                  scoreBySlug.get(tool.slug) === null
                    ? "Valutazione editoriale in preparazione"
                    : `#${rankBySlug.get(tool.slug)} · ${scoreBySlug.get(tool.slug)}/10`}</LocalizedText>
                </span>
              </div>
            ))}
          </div>
        </div></LocalizedAttributes>
      </div>

      <div
        className="compare-factor-matrix__rows"
        data-scrollable={tools.length >= 5 ? "true" : undefined}
      >
        {visibleFactors.map((factor, rowIndex) => {
          const isPrimary = factor.isPrimary;
          const pct = Math.round(factor.weight * 100);
          const helper = isPrimary
            ? `Fattore primario · peso ${pct}%`
            : `Fattore secondario · peso ${pct}%`;
          return (
            <div key={factor.key} className="compare-factor-matrix__row">
              <div
                className="compare-factor-matrix__axis"
                data-primary={isPrimary}
              >
                <span><LocalizedText>{factor.label}</LocalizedText></span>
                <small><LocalizedText>{helper}</LocalizedText></small>
              </div>
              <LocalizedAttributes><div
                className="compare-factor-matrix__scroll-wrap"
                tabIndex={0}
                aria-label={`Valori: ${factor.label}`}
                ref={(el) => {
                  cellsRef.current[rowIndex] = el;
                }}
                onScroll={() => handleScroll(rowIndex)}
              >
                {canScroll ? (
                  <div
                    className="compare-factor-matrix__scroll-hint"
                    aria-hidden="true"
                  >
                    <ArrowRight size={14} />
                  </div>
                ) : null}
                <div className="compare-factor-matrix__grid">
                  {tools.map((tool) => {
                    const dim = (tool.weightedDimensions ?? []).find(
                      (d) => d.key === factor.key,
                    );
                    if (!dim) {
                      return (
                        <div
                          key={tool.slug}
                          className="compare-factor-matrix__cell"
                        >
                          <span className="compare-factor-matrix__value">
                            <small className="compare-factor-matrix__fit-note"><LocalizedText>{"Dimensione non valutata per questo tool. "}</LocalizedText></small>
                          </span>
                        </div>
                      );
                    }
                    const isWinner = verdict.winner?.slug === tool.slug;
                    return (
                      <div
                        key={tool.slug}
                        className={cn(
                          "compare-factor-matrix__cell",
                          isWinner && "is-winner",
                        )}
                        style={
                          {
                            "--arena-a": tool.accentFrom,
                            "--arena-b": tool.accentTo,
                          } as CSSProperties
                        }
                      >
                        <div className="compare-factor-matrix__factor-cell">
                          <div className="compare-factor-matrix__factor-head">
                            <span className="compare-factor-matrix__factor-value">
                              {dim.value}/5
                            </span>
                            {isWinner ? (
                              <span className="compare-factor-matrix__factor-advantage"><LocalizedText>{"Vantaggio "}</LocalizedText></span>
                            ) : null}
                          </div>
                          <LocalizedAttributes><div
                            className="compare-factor-matrix__factor-track"
                            role="meter"
                            aria-label={`${tool.name}: ${dim.label}, valore ${dim.value} su 5, peso ${pct}%, contributo ${dim.contribution.toFixed(2)}`}
                            aria-valuenow={dim.value}
                            aria-valuemin={1}
                            aria-valuemax={5}
                          >
                            <span
                              className="compare-factor-matrix__factor-fill"
                              data-primary={dim.isPrimary}
                              style={{ width: `${(dim.value / 5) * 100}%` }}
                            />
                          </div></LocalizedAttributes>
                          <span className="compare-factor-matrix__factor-contrib"><LocalizedText>{"contributo "}</LocalizedText><LocalizedText>{dim.contribution.toFixed(2)}</LocalizedText>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div></LocalizedAttributes>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- mobile accordion ---------- */

function MobileFactorAccordion({
  tools,
  objective,
  verdict,
}: {
  tools: NormalisedTool[];
  objective: CompareObjective | null;
  verdict: BattleVerdict;
}) {
  const [openFactor, setOpenFactor] = useState<string | null>(null);
  const factors = Array.from(
    new Map(
      tools
        .flatMap((tool) => tool.weightedDimensions ?? [])
        .map((dimension) => [dimension.key, dimension.label]),
    ),
  );

  if (factors.length === 0) {
    return (
      <p className="compare-factor-accordion__empty"><LocalizedText>{"Seleziona un obiettivo per vedere il peso dei fattori. "}</LocalizedText></p>
    );
  }

  return (
    <LocalizedAttributes><div
      className="compare-factor-accordion"
      data-layout="mobile"
      aria-label={`Fattori per ${objective ? getCompareObjectiveLabel(objective) : "il confronto"}`}
    >
      {factors.map(([key, label], index) => {
        const isOpen =
          openFactor === key || (openFactor === null && index === 0);
        const contentId = `compare-factor-${key}`;
        return (
          <section key={key} className="compare-factor-accordion__section">
            <button
              type="button"
              className="compare-factor-accordion__summary"
              onClick={() => setOpenFactor(isOpen ? "" : key)}
              aria-expanded={isOpen}
              aria-controls={contentId}
            >
              <span><LocalizedText>{label}</LocalizedText></span>
              <span aria-hidden="true"><LocalizedText>{isOpen ? "−" : "+"}</LocalizedText></span>
            </button>
            {isOpen ? (
              <div id={contentId} className="compare-factor-accordion__content">
                {tools.map((tool) => {
                  const dimension = tool.weightedDimensions?.find(
                    (item) => item.key === key,
                  );
                  if (!dimension) return null;
                  return (
                    <div
                      key={tool.slug}
                      className="compare-factor-accordion__tool-row"
                      data-winner={verdict.winner?.slug === tool.slug}
                    >
                      <span className="compare-factor-accordion__tool-name">
                        {tool.name}
                      </span>
                      <span className="compare-factor-accordion__tool-value">
                        {dimension.value}/5
                      </span>
                      <LocalizedAttributes><span
                        className="compare-factor-accordion__tool-bar"
                        role="meter"
                        aria-valuenow={dimension.value}
                        aria-valuemin={1}
                        aria-valuemax={5}
                        aria-label={`${tool.name}: ${dimension.label}, valore ${dimension.value} su 5, peso ${Math.round(dimension.weight * 100)}%, contributo ${dimension.contribution.toFixed(2)}`}
                      >
                        <span
                          className="compare-factor-accordion__tool-bar-fill"
                          style={
                            {
                              width: `${(dimension.value / 5) * 100}%`,
                              "--arena-a": tool.accentFrom,
                            } as CSSProperties
                          }
                        />
                      </span></LocalizedAttributes>
                      <span className="compare-factor-accordion__tool-contrib"><LocalizedText>{"contrib "}</LocalizedText><LocalizedText>{dimension.contribution.toFixed(2)}</LocalizedText>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div></LocalizedAttributes>
  );
}

/* ---------- shared entry ---------- */

export function CompareFactorMatrix({
  tools,
  objective = null,
  verdict: suppliedVerdict = null,
  layoutMode,
}: CompareFactorMatrixProps) {
  if (tools.length < MIN_COMPARE_TOOLS) return null;

  if (layoutMode === "mobile") {
    const verdict = suppliedVerdict ?? getBattleVerdict(tools, objective);
    return (
      <MobileFactorAccordion
        tools={tools}
        objective={objective}
        verdict={verdict}
      />
    );
  }

  return (
    <DesktopFactorMatrix
      tools={tools}
      objective={objective}
      verdict={suppliedVerdict}
    />
  );
}

/**
 * Backwards-compatible DiffMatrix wrapper. Existing imports from
 * \`desktop-compare-view.tsx\` (\`DiffMatrix\` from \`mobile-compare-view\`) keep
 * working: \`mobile=true\` selects the accordion layout; \`mobile=false\`
 * (default) renders the full horizontal matrix.
 */
export function DiffMatrix({
  tools,
  objective = null,
  verdict: suppliedVerdict = null,
  mobile = false,
}: {
  tools: NormalisedTool[];
  objective?: CompareObjective | null;
  verdict?: BattleVerdict | null;
  mobile?: boolean;
}) {
  return (
    <CompareFactorMatrix
      tools={tools}
      objective={objective}
      verdict={suppliedVerdict}
      layoutMode={mobile ? "mobile" : "desktop"}
    />
  );
}
