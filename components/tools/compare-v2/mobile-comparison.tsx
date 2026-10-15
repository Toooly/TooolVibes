"use client";
import {
  COMPARISON_GROUPS,
  comparisonKeyDifferences,
  projectComparisonPair,
  resolveComparisonPair,
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

type Props = ComparisonPresentationProps & {
  pair: string[];
  onPairChange: (pair: string[]) => void;
};
export default function MobileComparison({
  model,
  pair: requested,
  onPairChange,
  differencesOnly,
  onDifferencesChange,
  onManage,
  onDecide,
}: Props) {
  const t = useCompareCopy();
  const pair = resolveComparisonPair(
    model.tools.map((tool) => tool.slug),
    requested,
  );
  const paired = projectComparisonPair(model, pair);
  const differences = comparisonKeyDifferences(paired);
  return (
    <div className="cv-mobile" data-compare-renderer="mobile">
      <section className="cv-pair" aria-label={t("Cambia coppia")}>
        {paired.tools.map((tool, index) => (
          <div className="cv-pair__tool" key={index}>
            <ComparisonMark key={tool.slug} tool={tool} />
            <label>
              <span className="cv-eyebrow">
                {t(index === 0 ? "Primo tool" : "Secondo tool")}
              </span>
              <select
                aria-label={t(index === 0 ? "Primo tool" : "Secondo tool")}
                value={tool.slug}
                onChange={(event) =>
                  onPairChange(
                    pair.map((slug, position) =>
                      position === index ? event.target.value : slug,
                    ),
                  )
                }
              >
                {model.tools.map((candidate) => (
                  <option
                    value={candidate.slug}
                    key={candidate.slug}
                    disabled={candidate.slug === pair[1 - index]}
                  >
                    {candidate.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="cv-link"
              type="button"
              onClick={() => onManage(tool.slug)}
              aria-label={`${t("Sostituisci")} ${tool.name}`}
            >
              <T>Sostituisci</T>
            </button>
          </div>
        ))}
      </section>
      <div className="cv-filter-row">
        <DifferencesSwitch
          checked={differencesOnly}
          onChange={onDifferencesChange}
        />
        <span className="cv-muted">
          {model.tools.length} <T>selezionati</T>
        </span>
      </div>
      <KeyDifferences model={paired} rows={differences} />
      <section className="cv-details" aria-label={t("Criteri")}>
        {COMPARISON_GROUPS.map((group) => (
          <ComparisonDisclosure
            key={group.id}
            id={group.id}
            title={group.label}
            model={paired}
            rows={paired.criteria.filter((row) => row.group === group.id)}
            differencesOnly={differencesOnly}
          />
        ))}
      </section>
      <ComparisonDecision tools={paired.tools} onDecide={onDecide} />
    </div>
  );
}
