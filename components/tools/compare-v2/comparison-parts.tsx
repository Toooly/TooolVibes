"use client";
import { useId, useState } from "react";
import { firstListItemOrSentence } from "@/lib/content/tool-markdown-public";
import Link from "@/components/ui/app-link";
import type {
  ComparisonCandidate,
  ComparisonCriterion,
  ComparisonValue,
  ComparisonViewModel,
} from "@/lib/compare/comparison-view-model";
import { CompareText as T, useCompareCopy } from "./compare-copy";

export type ComparisonPresentationProps = {
  model: ComparisonViewModel;
  differencesOnly: boolean;
  onDifferencesChange: (value: boolean) => void;
  onManage: (slug?: string) => void;
  onRemove: (slug: string) => void;
  onDecide?: (slug: string) => void;
};
export function ComparisonMark({ tool }: { tool: ComparisonCandidate }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="cv-mark" aria-hidden="true">
      {tool.logoUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tool.logoUrl}
          width={32}
          height={32}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        tool.name.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
export function ComparisonCell({
  value,
  compact = false,
}: {
  value: ComparisonValue;
  compact?: boolean;
}) {
  const t = useCompareCopy();
  const text = compact
    ? (firstListItemOrSentence(t(value.text), 180) ?? t(value.text))
    : value.text;
  return (
    <span className="cv-value" data-missing={value.missing || undefined}>
      {value.items
        ? value.items.map((parts, i) => (
            <span className="cv-value__line" key={i}>
              {parts.filter(Boolean).map((part, j) => (
                <span key={j}>
                  {j > 0 ? " · " : ""}
                  <T>{part}</T>
                </span>
              ))}
            </span>
          ))
        : text.split("\n").map((line, i) => (
            <span className="cv-value__line" key={i}>
              {compact ? line : <T>{line}</T>}
            </span>
          ))}
      {value.source ? (
        <a
          className="cv-source"
          href={value.source}
          target="_blank"
          rel="noopener noreferrer"
        >
          <T>Fonte prezzi</T> ↗
        </a>
      ) : null}
    </span>
  );
}
export function DifferencesSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="cv-differences-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <T>Mostra solo differenze</T>
      </span>
    </label>
  );
}
export function KeyDifferences({
  model,
  rows,
}: {
  model: ComparisonViewModel;
  rows: ComparisonCriterion[];
}) {
  return (
    <section className="cv-key" aria-labelledby="cv-key-title">
      <h2 id="cv-key-title">
        <T>Differenze da cui partire</T>
      </h2>
      {rows.length ? (
        <ol>
          {rows.map((row, i) => (
            <li key={row.id} data-criterion={row.id}>
              <h3>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{" "}
                <T>{row.label}</T>
              </h3>
              <div
                className="cv-key__values"
                style={{
                  gridTemplateColumns: `repeat(${model.tools.length}, minmax(0, 1fr))`,
                }}
              >
                {model.tools.map((tool) => (
                  <div key={tool.slug}>
                    <p className="cv-tool-label">{tool.name}</p>
                    <ComparisonCell value={row.values[tool.slug]} compact />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="cv-muted">
          <T>Nessuna differenza documentata tra questi tool.</T>
        </p>
      )}
    </section>
  );
}
export function ComparisonDisclosure({
  id,
  title,
  model,
  rows,
  differencesOnly,
  desktop = false,
  initialOpen = false,
}: {
  id: string;
  title: string;
  model: ComparisonViewModel;
  rows: ComparisonCriterion[];
  differencesOnly: boolean;
  desktop?: boolean;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const region = useId();
  const available = rows.filter((row) =>
    Object.values(row.values).some((cell) => !cell.missing),
  );
  const visible = differencesOnly
    ? available.filter((row) => row.differs)
    : available;
  return (
    <section className="cv-group" id={`cv-group-${id}`} data-open={open}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? region : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          <T>{title}</T>
          <span className="cv-group__meta">
            {visible.length} <span aria-hidden="true">{open ? "−" : "+"}</span>
          </span>
        </button>
      </h3>
      {open ? (
        <div
          id={region}
          className={
            desktop
              ? "cv-group__rows cv-group__rows--desktop"
              : "cv-group__rows"
          }
        >
          {visible.length ? (
            visible.map((row) => (
              <div
                className="cv-criterion"
                key={row.id}
                data-criterion={row.id}
                data-differs={row.differs}
              >
                <h4>
                  <T>{row.label}</T>
                </h4>
                <div
                  className="cv-criterion__values"
                  style={{
                    gridTemplateColumns: `repeat(${model.tools.length}, minmax(0, 1fr))`,
                  }}
                >
                  {model.tools.map((tool) => (
                    <div key={tool.slug} role="group" aria-label={tool.name}>
                      <span className="cv-criterion__tool">{tool.name}</span>
                      <ComparisonCell value={row.values[tool.slug]} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="cv-muted">
              <T>
                {available.length
                  ? "Stessi valori per i tool selezionati."
                  : "Nessun dato documentato per questa sezione."}
              </T>
            </p>
          )}
          <p className="cv-footnote">
            <T>
              Le informazioni mancanti non indicano una funzionalità assente.
            </T>
          </p>
        </div>
      ) : null}
    </section>
  );
}
export function ComparisonDecision({
  tools,
  onDecide,
}: {
  tools: ComparisonCandidate[];
  onDecide?: (slug: string) => void;
}) {
  const t = useCompareCopy();
  if (!onDecide) return null;
  return (
    <section
      className="cv-decision"
      id="cv-decision"
      aria-labelledby="cv-decision-title"
    >
      <p className="cv-eyebrow">
        <T>La tua scelta</T>
      </p>
      <h2 id="cv-decision-title">
        <T>Quale vuoi provare?</T>
      </h2>
      <p className="cv-muted">
        <T>Registra una scelta, senza un vincitore automatico.</T>
      </p>
      <div className="cv-decision__choices">
        {tools.map((tool) => (
          <div key={tool.slug}>
            <button
              className="cv-button cv-button--primary"
              type="button"
              onClick={() => onDecide(tool.slug)}
            >
              {t("Scegli")} {tool.name}
            </button>
            <Link href={`/toools/${tool.slug}`} className="cv-link">
              {t("Apri scheda")} ↗
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
