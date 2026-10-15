"use client";
import type { CSSProperties } from "react";
import {
  COMPARISON_GROUPS,
  comparisonKeyDifferences,
} from "@/lib/compare/comparison-view-model";
import {
  ComparisonCell,
  ComparisonDecision,
  ComparisonDisclosure,
  ComparisonMark,
  DifferencesSwitch,
  KeyDifferences,
  type ComparisonPresentationProps,
} from "./comparison-parts";
import { CompareText as T, useCompareCopy } from "./compare-copy";

export default function DesktopComparison({
  model,
  differencesOnly,
  onDifferencesChange,
  onManage,
  onRemove,
  onDecide,
}: ComparisonPresentationProps) {
  const t = useCompareCopy();
  return (
    <div
      className="cv-desktop"
      data-compare-renderer="desktop"
      style={{ "--cv-count": model.tools.length } as CSSProperties}
    >
      <div
        className="cv-summary"
        style={{
          gridTemplateColumns: `repeat(${model.tools.length}, minmax(0, 1fr))`,
        }}
      >
        {model.tools.map((tool) => (
          <article className="cv-summary__tool" key={tool.slug}>
            <header>
              <ComparisonMark tool={tool} />
              <h2>{tool.name}</h2>
              {tool.rating !== null ? (
                <span className="cv-rating">
                  {tool.rating.toFixed(1)}
                  <small>/10</small>
                </span>
              ) : (
                <span className="cv-muted cv-rating-empty">
                  <T>Valutazione non disponibile</T>
                </span>
              )}
            </header>
            <ComparisonCell value={tool.pricing} />
            <dl>
              <div>
                <dt>
                  <T>Ideale per</T>
                </dt>
                <dd>
                  <T>{tool.bestFor}</T>
                </dd>
              </div>
              <div>
                <dt>
                  <T>Punto di forza</T>
                </dt>
                <dd>
                  <T>{tool.strength}</T>
                </dd>
              </div>
              <div>
                <dt>
                  <T>Da considerare</T>
                </dt>
                <dd>
                  <T>{tool.tradeoff}</T>
                </dd>
              </div>
            </dl>
            <div className="cv-summary__actions">
              <button
                className="cv-link"
                type="button"
                onClick={(event) => onManage(tool.slug, event.currentTarget)}
                aria-label={`${t("Sostituisci")} ${tool.name}`}
              >
                <T>Sostituisci</T>
              </button>
              <button
                className="cv-link"
                type="button"
                onClick={() => onRemove(tool.slug)}
                aria-label={`${t("Rimuovi")} ${tool.name}`}
              >
                <T>Rimuovi</T>
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="cv-filter-row">
        <DifferencesSwitch
          checked={differencesOnly}
          onChange={onDifferencesChange}
        />
        <nav className="cv-group-nav" aria-label={t("Criteri")}>
          {COMPARISON_GROUPS.map((group) => (
            <a
              href={`#cv-group-${group.id}`}
              key={group.id}
              onClick={() => {
                const trigger = document
                  .getElementById(`cv-group-${group.id}`)
                  ?.querySelector("button");
                if (trigger?.getAttribute("aria-expanded") === "false")
                  trigger.click();
                trigger?.focus({ preventScroll: true });
                window.requestAnimationFrame?.(() =>
                  trigger?.focus({ preventScroll: true }),
                );
              }}
            >
              <T>{group.label}</T>
            </a>
          ))}
        </nav>
      </div>
      <KeyDifferences model={model} rows={comparisonKeyDifferences(model, 4)} />
      <section className="cv-matrix" aria-label={t("Criteri")}>
        <div className="cv-matrix__head">
          <span>
            <T>Criteri</T>
          </span>
          <div
            style={{
              gridTemplateColumns: `repeat(${model.tools.length}, minmax(0, 1fr))`,
            }}
          >
            {model.tools.map((tool) => (
              <span key={tool.slug}>
                <ComparisonMark tool={tool} />
                {tool.name}
              </span>
            ))}
          </div>
        </div>
        {COMPARISON_GROUPS.map((group) => (
          <ComparisonDisclosure
            key={group.id}
            id={group.id}
            title={group.label}
            model={model}
            rows={model.criteria.filter((row) => row.group === group.id)}
            differencesOnly={differencesOnly}
            desktop
            initialOpen={group.id === "overview"}
          />
        ))}
      </section>
      <ComparisonDecision tools={model.tools} onDecide={onDecide} />
    </div>
  );
}
