"use client";

import { useEffect } from "react";
import Link from "@/components/ui/app-link";

import { useAccount } from "@/components/account/account-provider";
import { salvatiHref } from "@/components/account/workspace/workspace-model";
import { WorkspaceToolMark } from "@/components/account/workspace/workspace-tool-mark";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import { CompareDeepEntry } from "./compare-personal-context";
import {
  consumeCompareDecision,
  peekCompareDecision,
} from "./compare-workbench-ephemeral";

export type CompareWorkbenchTool = {
  slug: string;
  name: string;
  accentFrom?: string | null;
  accentTo?: string | null;
};

export function phraseCompareTitle(names: readonly string[]) {
  return names.filter(Boolean).join(" vs ");
}

function useSalvatiAddHref() {
  const account = useAccount();
  return salvatiHref(account?.status === "authenticated");
}

function CompareAddLinks({
  primary = false,
}: {
  primary?: boolean;
}) {
  const salvati = useSalvatiAddHref();
  return (
    <div className="compare-workbench-chrome__actions">
      <Link
        href={salvati}
        className={
          primary
            ? "compare-workbench-chrome__cta compare-workbench-chrome__cta--primary"
            : "compare-workbench-chrome__cta"
        }
      >
        Aggiungi da Salvati
      </Link>
      <Link href="/archivio" className="compare-workbench-chrome__cta">
        Apri il catalogo
      </Link>
    </div>
  );
}

function ChiudiConfronto({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      className="compare-workbench-chrome__chiudi"
      onClick={() => {
        consumeCompareDecision();
        onClear();
      }}
    >
      Chiudi confronto
    </button>
  );
}

export function CompareWorkbenchEmpty() {
  const closed = peekCompareDecision();

  if (closed) {
    return (
      <section
        className="compare-workbench-chrome compare-workbench-chrome--empty"
        data-compare-workbench-state="closed"
        aria-labelledby="compare-workbench-empty-title"
      >
        <h2 id="compare-workbench-empty-title">Confronto chiuso.</h2>
        <p>La decisione è registrata.</p>
        <div className="compare-workbench-chrome__actions">
          {closed.slug ? (
            <Link
              href={`/toools/${closed.slug}`}
              className="compare-workbench-chrome__cta compare-workbench-chrome__cta--primary"
            >
              Vedi {closed.name}
            </Link>
          ) : null}
        </div>
        <CompareAddLinks />
      </section>
    );
  }

  return (
    <section
      className="compare-workbench-chrome compare-workbench-chrome--empty"
      data-compare-workbench-state="empty"
      aria-labelledby="compare-workbench-empty-title"
    >
      <h2 id="compare-workbench-empty-title">Servono due strumenti.</h2>
      <p>
        Questo è un confronto temporaneo, non una libreria: serve per
        scegliere, poi si chiude.
      </p>
      <CompareAddLinks primary />
    </section>
  );
}

export function CompareWorkbenchPrep({
  tool,
  onRemove,
  onClear,
}: {
  tool: CompareWorkbenchTool;
  onRemove: (slug: string) => void;
  onClear: () => void;
}) {
  useEffect(() => {
    consumeCompareDecision();
  }, [tool.slug]);

  return (
    <section
      className="compare-workbench-chrome compare-workbench-chrome--prep"
      data-compare-workbench-state="prep"
      aria-labelledby="compare-workbench-prep-title"
    >
      <div className="compare-workbench-chrome__identity">
        <WorkspaceToolMark
          slug={tool.slug}
          name={tool.name}
          accentFrom={tool.accentFrom ?? undefined}
          accentTo={tool.accentTo ?? undefined}
          size="sm"
        />
        <h2 id="compare-workbench-prep-title">{tool.name}</h2>
        <button
          type="button"
          className="compare-workbench-chrome__remove"
          onClick={() => onRemove(tool.slug)}
          aria-label={`Rimuovi ${tool.name} dal confronto`}
        >
          Rimuovi
        </button>
      </div>
      <p>Serve ancora uno strumento per confrontare.</p>
      <CompareAddLinks />
      <ChiudiConfronto onClear={onClear} />
    </section>
  );
}

export function CompareWorkbenchIdentity({
  tools,
  onRemove,
  onClear,
  decisionEnabled = true,
  layoutMode,
  onDecidi,
}: {
  tools: readonly CompareWorkbenchTool[];
  onRemove: (slug: string) => void;
  onClear: () => void;
  decisionEnabled?: boolean;
  layoutMode: "mobile" | "desktop";
  onDecidi?: () => void;
}) {
  const compareKey = tools.map((tool) => tool.slug).join("|");
  useEffect(() => {
    consumeCompareDecision();
  }, [compareKey]);

  const title = phraseCompareTitle(tools.map((tool) => tool.name));
  const atCap = tools.length >= MAX_COMPARE_TOOLS;

  return (
    <>
      <header
        className="compare-workbench-identity"
        data-compare-identity=""
        data-compare-workbench-state="battle"
        data-layout={layoutMode}
        data-count={tools.length}
      >
        <div className="compare-workbench-identity__bar">
          <h2 className="compare-workbench-identity__title">{title}</h2>
          <div className="compare-workbench-identity__meta">
            {atCap ? (
              <p className="compare-workbench-identity__cap">5 su 5</p>
            ) : null}
            {decisionEnabled ? (
              <button
                type="button"
                className="compare-workbench-identity__decide"
                onClick={onDecidi}
              >
                Decidi
              </button>
            ) : null}
            <CompareDeepEntry />
            <ChiudiConfronto onClear={onClear} />
          </div>
        </div>
        <ul className="compare-workbench-identity__tools">
          {tools.map((tool) => (
            <li key={tool.slug} className="compare-workbench-identity__tool">
              <WorkspaceToolMark
                slug={tool.slug}
                name={tool.name}
                accentFrom={tool.accentFrom ?? undefined}
                accentTo={tool.accentTo ?? undefined}
                size="xs"
              />
              <span className="compare-workbench-identity__name">{tool.name}</span>
              <button
                type="button"
                className="compare-workbench-chrome__remove"
                onClick={() => onRemove(tool.slug)}
                aria-label={`Rimuovi ${tool.name} dal confronto`}
              >
                Rimuovi
              </button>
            </li>
          ))}
        </ul>
      </header>
      {decisionEnabled && layoutMode === "mobile" ? (
        <button
          type="button"
          className="compare-workbench-decide-jump"
          onClick={onDecidi}
        >
          Decidi
        </button>
      ) : null}
    </>
  );
}
