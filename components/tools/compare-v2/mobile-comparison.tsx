"use client";
import {
  COMPARISON_GROUPS,
  comparisonKeyDifferences,
} from "@/lib/compare/comparison-view-model";
import {
  ComparisonDecision,
  ComparisonDisclosure,
  ComparisonMark,
  DifferencesSwitch,
  KeyDifferences,
  type ComparisonPresentationProps,
} from "./comparison-parts";
import { CompareText as T, useCompareCopy } from "./compare-copy";

export default function MobileComparison({
  model,
  differencesOnly,
  onDifferencesChange,
  onManage,
  onDecide,
}: ComparisonPresentationProps) {
  const t = useCompareCopy();
  const differences = comparisonKeyDifferences(model);
  return (
    <div className="cv-mobile" data-compare-renderer="mobile">
      <section className="cv-roster" aria-label={t("Tool a confronto")}>
        <p className="cv-roster__hint">
          <T>Tutti i tool, un criterio alla volta.</T>
        </p>
        <ul>
          {model.tools.map((tool) => (
            <li key={tool.slug}>
              <ComparisonMark tool={tool} />
              <strong>{tool.name}</strong>
              <button
                type="button"
                className="cv-link"
                aria-label={`${t("Sostituisci")} ${tool.name}`}
                onClick={(event) => onManage(tool.slug, event.currentTarget)}
              >
                <T>Sostituisci</T>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <div className="cv-filter-row">
        <DifferencesSwitch
          checked={differencesOnly}
          onChange={onDifferencesChange}
        />
      </div>
      <KeyDifferences model={model} rows={differences} stacked />
      <section className="cv-details" aria-label={t("Criteri")}>
        {COMPARISON_GROUPS.map((group) => (
          <ComparisonDisclosure
            key={group.id}
            id={group.id}
            title={group.label}
            model={model}
            rows={model.criteria.filter((row) => row.group === group.id)}
            differencesOnly={differencesOnly}
            stacked
          />
        ))}
      </section>
      <ComparisonDecision tools={model.tools} onDecide={onDecide} />
    </div>
  );
}
