"use client";
import { useEffect, useRef, useState } from "react";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import type { ComparisonFocusTarget } from "./comparison-parts";
import { CompareText as T, useCompareCopy } from "./compare-copy";

type Props = {
  tools: readonly ToolPublicView[];
  selected: readonly string[];
  replacing: string | null;
  onSelect: (slug: string) => void;
  onRemove: (slug: string) => void;
  onClear: () => void;
  onClose: () => void;
  returnFocusTo?: ComparisonFocusTarget | null;
};
export default function ComparisonManager({
  tools,
  selected,
  replacing,
  onSelect,
  onRemove,
  onClear,
  onClose,
  returnFocusTo,
}: Props) {
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const t = useCompareCopy();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = returnFocusTo ?? document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      const returnTo =
        previousFocus instanceof HTMLElement && previousFocus.isConnected
          ? previousFocus
          : document.querySelector<HTMLButtonElement>(
              ".cv-toolbar__actions button:not(:disabled)",
            );
      returnTo?.focus({ preventScroll: true });
    };
  }, [returnFocusTo]);
  const normalized = query.trim().toLocaleLowerCase();
  const filtered = tools.filter((tool) =>
    `${tool.name} ${tool.categoryLabel}`
      .toLocaleLowerCase()
      .includes(normalized),
  );
  return (
    <dialog
      ref={ref}
      className="cv-manager"
      aria-labelledby="cv-manager-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        backdropPress.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && backdropPress.current)
          onClose();
        backdropPress.current = false;
      }}
    >
      <div className="cv-manager__surface">
        <header>
          <h2 id="cv-manager-title">
            <T>{replacing ? "Sostituisci" : "Aggiungi tool"}</T>
          </h2>
          <button
            className="cv-button cv-manager__close"
            type="button"
            onClick={onClose}
            aria-label={t("Chiudi")}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        {!replacing && selected.length > 0 ? (
          <div className="cv-manager__selection">
            <div className="cv-manager__selected">
              {selected.map((slug) => (
                <button
                  className="cv-button"
                  key={slug}
                  type="button"
                  onClick={() => onRemove(slug)}
                  aria-label={`${t("Rimuovi")} ${tools.find((tool) => tool.slug === slug)?.name ?? slug}`}
                >
                  {tools.find((tool) => tool.slug === slug)?.name ?? slug}{" "}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <button className="cv-link" type="button" onClick={onClear}>
              <T>Azzera confronto</T>
            </button>
          </div>
        ) : null}
        {!replacing && selected.length >= MAX_COMPARE_TOOLS ? (
          <p className="cv-muted">
            <T>Rimuovi un tool per aggiungerne un altro.</T>
          </p>
        ) : null}
        <label className="cv-search">
          <span>
            <T>Cerca un tool</T>
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Cerca un tool")}
            autoComplete="off"
          />
        </label>
        <ul className="cv-manager__results">
          {filtered.map((tool) => {
            const included =
              selected.includes(tool.slug) && tool.slug !== replacing;
            return (
              <li key={tool.slug}>
                <button
                  type="button"
                  disabled={
                    included ||
                    (!replacing && selected.length >= MAX_COMPARE_TOOLS)
                  }
                  onClick={() => onSelect(tool.slug)}
                >
                  <span>
                    <strong>{tool.name}</strong>
                    <small>
                      <T>{tool.categoryLabel}</T>
                    </small>
                  </span>
                  <span className="cv-manager__action">
                    <T>
                      {included
                        ? "Già nel confronto"
                        : replacing
                          ? "Sostituisci"
                          : "Aggiungi tool"}
                    </T>
                  </span>
                </button>
              </li>
            );
          })}
          {!filtered.length ? (
            <li className="cv-muted">
              <T>Nessun tool trovato.</T>
            </li>
          ) : null}
        </ul>
      </div>
    </dialog>
  );
}
