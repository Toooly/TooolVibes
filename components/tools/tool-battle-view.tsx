"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/account/account-provider";
import { salvatiHref } from "@/components/account/workspace/workspace-model";
import Link from "@/components/ui/app-link";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { useCompareObjective } from "@/lib/hooks/use-compare-objective";
import {
  COMPARE_OBJECTIVES,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import {
  buildComparisonViewModel,
  resolveComparisonPair,
} from "@/lib/compare/comparison-view-model";
import {
  MAX_COMPARE_TOOLS,
  MIN_COMPARE_TOOLS,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { CompareText as T, useCompareCopy } from "./compare-v2/compare-copy";
import {
  captureCompareDecisionTarget,
  type CompareDecisionTarget,
} from "./compare-v2/decision-target";
import {
  consumeCompareDecision,
  peekCompareDecision,
} from "./compare-workbench-ephemeral";

function Preparing() {
  return (
    <p className="cv-loading" role="status">
      <T>Preparazione del confronto…</T>
    </p>
  );
}
const MobileComparison = dynamic(
  () => import("./compare-v2/mobile-comparison"),
  { loading: Preparing },
);
const DesktopComparison = dynamic(
  () => import("./compare-v2/desktop-comparison"),
  { loading: Preparing },
);
const ComparisonManager = dynamic(
  () => import("./compare-v2/comparison-manager"),
);
const CompareDecideSheet = dynamic(() =>
  import("./compare-decision-panel").then(
    (module) => module.CompareDecideSheet,
  ),
);
export const COMPARE_DESKTOP_MEDIA_QUERY = "(min-width: 1280px)";

export function ToolBattleView({
  tools,
  objectiveEnabled = true,
  decisionEnabled = true,
  showIntro = true,
}: {
  tools: ToolPublicView[];
  objectiveEnabled?: boolean;
  decisionEnabled?: boolean;
  showIntro?: boolean;
}) {
  const t = useCompareCopy();
  const account = useAccount();
  const slugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const clearCompare = useToolWorkspaceStore((state) => state.clearCompare);
  const { objective, setObjective } = useCompareObjective();
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const [pair, setPair] = useState<string[]>([]);
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [manager, setManager] = useState<{ replacing: string | null } | null>(
    null,
  );
  const [target, setTarget] = useState<CompareDecisionTarget | null>(null);
  const [notice, setNotice] = useState("");
  const activeObjective = objectiveEnabled ? objective : null;
  const model = useMemo(
    () => buildComparisonViewModel(tools, slugs, activeObjective),
    [tools, slugs, activeObjective],
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setDesktop(false);
      return;
    }
    const media = window.matchMedia(COMPARE_DESKTOP_MEDIA_QUERY);
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function selectTool(slug: string) {
    const current = useToolWorkspaceStore.getState().compareSlugs;
    const replacing = manager?.replacing;
    if (current.includes(slug) && slug !== replacing) return;
    if (replacing && current.includes(replacing)) {
      if (slug !== replacing) {
        toggleCompare(replacing);
        toggleCompare(slug);
        setPair(
          resolveComparisonPair(current, pair).map((item) =>
            item === replacing ? slug : item,
          ),
        );
      }
    } else if (current.length >= MAX_COMPARE_TOOLS) {
      setNotice("Hai raggiunto il limite di tool.");
      return;
    } else {
      toggleCompare(slug);
    }
    consumeCompareDecision();
    setNotice("");
    setManager(null);
  }
  function removeTool(slug: string) {
    toggleCompare(slug);
    setNotice("");
  }
  function decide(slug: string) {
    setTarget(
      captureCompareDecisionTarget(
        model.tools.map((tool) => tool.normalised),
        slug,
      ),
    );
  }
  const presentation = {
    model,
    differencesOnly,
    onDifferencesChange: setDifferencesOnly,
    onManage: (slug?: string) => setManager({ replacing: slug ?? null }),
    onRemove: removeTool,
    onDecide: decisionEnabled ? decide : undefined,
  };

  return (
    <section className="cv-workspace" aria-label={t("Confronto")}>
      {showIntro ? (
        <header className="cv-intro">
          <p className="cv-eyebrow">
            <T>Confronta e scegli</T>
          </p>
          <h1>
            <T>Poche differenze. Una scelta più chiara.</T>
          </h1>
          <p className="cv-muted">
            <T>
              {desktop
                ? "Due–quattro tool, con i dati che servono per decidere."
                : "Scegli una coppia, leggi le differenze e decidi cosa provare."}
            </T>
          </p>
        </header>
      ) : null}
      <div className="cv-toolbar">
        <div className="cv-toolbar__actions">
          <button
            className="cv-button cv-button--primary"
            type="button"
            disabled={slugs.length >= MAX_COMPARE_TOOLS}
            onClick={() => setManager({ replacing: null })}
          >
            <span aria-hidden="true">＋ </span>
            <T>Aggiungi tool</T>
          </button>
          {slugs.length ? (
            <>
              <button
                className="cv-button"
                type="button"
                onClick={() => setManager({ replacing: null })}
              >
                <T>Gestisci tool</T>
                <span className="cv-count">
                  {slugs.length}/{MAX_COMPARE_TOOLS}
                </span>
              </button>
              <button
                className="cv-link"
                type="button"
                onClick={() => {
                  consumeCompareDecision();
                  clearCompare();
                  setNotice("");
                }}
              >
                <T>Azzera confronto</T>
              </button>
            </>
          ) : null}
        </div>
        {objectiveEnabled && model.tools.length >= MIN_COMPARE_TOOLS ? (
          <label className="cv-objective">
            <span>
              <T>Obiettivo</T>
            </span>
            <select
              value={objective ?? ""}
              onChange={(event) =>
                setObjective(
                  (event.target.value || null) as CompareObjective | null,
                )
              }
            >
              <option value="">
                <T>Lettura generale</T>
              </option>
              {COMPARE_OBJECTIVES.map((item) => (
                <option key={item.key} value={item.key}>
                  {t(item.label)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      {objectiveEnabled && activeObjective ? (
        <p className="cv-footnote">
          <T>
            La scelta resta tua: l’obiettivo ordina i criteri, senza assegnare
            un vincitore automatico.
          </T>
        </p>
      ) : null}
      {slugs.length > 4 ? (
        <p className="cv-footnote">
          <T>Confronta 2–4 candidati per una lettura più diretta.</T>
        </p>
      ) : null}
      {notice ? <p role="status">{t(notice)}</p> : null}
      {model.missingSlugs.length ? (
        <aside className="cv-unavailable">
          <p>
            <T>Tool non disponibili nel catalogo</T>
          </p>
          {model.missingSlugs.map((slug) => (
            <button
              className="cv-link"
              type="button"
              key={slug}
              onClick={() => removeTool(slug)}
            >
              {t("Rimuovi")} {slug}
            </button>
          ))}
        </aside>
      ) : null}
      {model.tools.length < MIN_COMPARE_TOOLS ? (
        <div className="cv-empty">
          <h2>
            <T>
              {!slugs.length && peekCompareDecision()
                ? "Confronto chiuso."
                : "Scegli almeno due tool."}
            </T>
          </h2>
          <p className="cv-muted">
            <T>Aggiungili qui oppure riparti dal catalogo o dai salvati.</T>
          </p>
          {model.tools.map((tool) => (
            <p key={tool.slug}>
              {tool.name}{" "}
              <button
                type="button"
                className="cv-link"
                onClick={() => removeTool(tool.slug)}
                aria-label={`${t("Rimuovi")} ${tool.name}`}
              >
                <T>Rimuovi</T>
              </button>
            </p>
          ))}
          <div className="cv-toolbar__actions">
            <Link href="/archivio" className="cv-button">
              <T>Apri il catalogo</T>
            </Link>
            <Link
              href={salvatiHref(account?.status === "authenticated")}
              className="cv-link"
            >
              <T>Apri Salvati</T>
            </Link>
          </div>
        </div>
      ) : desktop === null ? (
        <Preparing />
      ) : desktop ? (
        <DesktopComparison {...presentation} />
      ) : (
        <MobileComparison
          {...presentation}
          pair={pair}
          onPairChange={setPair}
        />
      )}
      {manager ? (
        <ComparisonManager
          tools={tools}
          selected={slugs}
          replacing={manager.replacing}
          onSelect={selectTool}
          onRemove={removeTool}
          onClose={() => {
            setManager(null);
            setNotice("");
          }}
        />
      ) : null}
      {target ? (
        <CompareDecideSheet
          open
          target={target}
          objective={activeObjective}
          onOpenChange={(open) => {
            if (!open) setTarget(null);
          }}
        />
      ) : null}
    </section>
  );
}
