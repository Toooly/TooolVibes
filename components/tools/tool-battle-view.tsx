"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "@/components/account/account-provider";
import { salvatiHref } from "@/components/account/workspace/workspace-model";
import Link from "@/components/ui/app-link";
import { Plus } from "lucide-react";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { useCompareObjective } from "@/lib/hooks/use-compare-objective";
import {
  COMPARE_OBJECTIVES,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import {
  buildComparisonViewModel,
} from "@/lib/compare/comparison-view-model";
import {
  MAX_COMPARE_TOOLS,
  MIN_COMPARE_TOOLS,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { ComparisonMark, type ComparisonFocusTarget } from "./compare-v2/comparison-parts";
import ComparisonManager from "./compare-v2/comparison-manager";
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
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [manager, setManager] = useState<{ replacing: string | null } | null>(
    null,
  );
  const managerTrigger = useRef<ComparisonFocusTarget | null>(null);
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

  function openManager(
    replacing: string | null,
    trigger?: ComparisonFocusTarget,
  ) {
    managerTrigger.current =
      trigger ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    setManager({ replacing });
  }
  function selectTool(slug: string) {
    const current = useToolWorkspaceStore.getState().compareSlugs;
    const replacing = manager?.replacing;
    if (current.includes(slug) && slug !== replacing) return;
    if (replacing && current.includes(replacing)) {
      if (slug !== replacing) {
        toggleCompare(replacing);
        toggleCompare(slug);
      }
    } else if (current.length >= MAX_COMPARE_TOOLS) {
      setNotice("Hai raggiunto il limite di tool.");
      return;
    } else {
      toggleCompare(slug);
    }
    consumeCompareDecision();
    setNotice("");
    if (replacing || useToolWorkspaceStore.getState().compareSlugs.length >= MIN_COMPARE_TOOLS) {
      setManager(null);
    }
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
    onManage: (slug?: string, trigger?: ComparisonFocusTarget) =>
      openManager(slug ?? null, trigger),
    onRemove: removeTool,
    onDecide: decisionEnabled ? decide : undefined,
  };

  return (
    <section className="cv-workspace" aria-label={t("Confronto")}>
      {showIntro ? (
        <header className="cv-intro">
          <h1>
            <T>Confronta e scegli</T>
          </h1>
          <p className="cv-muted">
            <T>
              {desktop
                ? "Prezzi, funzioni e limiti dei tool selezionati."
                : "Leggi un criterio alla volta, per tutti i tool."}
            </T>
          </p>
        </header>
      ) : null}
      <div className="cv-toolbar">
        <div className="cv-toolbar__actions">
          {desktop || model.tools.length < MIN_COMPARE_TOOLS ? (
            <button
              className="cv-button cv-button--primary"
              type="button"
              disabled={slugs.length >= MAX_COMPARE_TOOLS}
              onClick={(event) => openManager(null, event.currentTarget)}
            >
              <span aria-hidden="true">＋</span>
              <T>Aggiungi tool</T>
            </button>
          ) : null}
          {slugs.length ? (
            <button
              className="cv-button"
              type="button"
              aria-label={t("Gestisci tool")}
              onClick={(event) => openManager(null, event.currentTarget)}
            >
              {desktop ? <T>Gestisci tool</T> : <T>Gestisci</T>}
              <span className="cv-count">{slugs.length}</span>
            </button>
          ) : null}
        </div>
        {objectiveEnabled && model.tools.length >= MIN_COMPARE_TOOLS ? (
          <label className="cv-objective" data-active={!!objective}>
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
      {desktop && objectiveEnabled && activeObjective ? (
        <p className="cv-footnote">
          <T>
            L’obiettivo mette in primo piano i criteri più utili.
          </T>
        </p>
      ) : null}
      {desktop && slugs.length > 4 ? (
        <p className="cv-footnote">
          <T>Per una tabella più breve, attiva “Mostra solo differenze”.</T>
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
            <T>Scegli dal catalogo o dai tool salvati.</T>
          </p>
          <ol className="cv-empty__slots" aria-label={t("Tool da confrontare")}>
            {[0, 1].map((index) => {
              const tool = model.tools[index];
              return (
                <li key={index}>
                  {tool ? (
                    <div className="cv-empty__candidate">
                      <ComparisonMark tool={tool} />
                      <strong>{tool.name}</strong>
                      <button type="button" className="cv-link" onClick={() => removeTool(tool.slug)} aria-label={`${t("Rimuovi")} ${tool.name}`}>
                        <T>Rimuovi</T>
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="cv-empty__pick" onClick={(event) => openManager(null, event.currentTarget)}>
                      <span className="cv-empty__number" aria-hidden="true">0{index + 1}</span>
                      <span><T>{index === 0 ? "Scegli il primo tool" : "Scegli il secondo tool"}</T></span>
                      <Plus size={18} aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="cv-toolbar__actions">
            <Link href="/archivio" className="cv-button">
              <T>Apri il catalogo</T>
            </Link>
            <Link
              href={salvatiHref(account?.status === "authenticated")}
              className="cv-link"
            >
              <T>Vai ai salvati</T>
            </Link>
          </div>
        </div>
      ) : desktop === null ? (
        <Preparing />
      ) : desktop ? (
        <DesktopComparison {...presentation} />
      ) : (
        <MobileComparison {...presentation} />
      )}
      {manager ? (
        <ComparisonManager
          tools={tools}
          selected={slugs}
          replacing={manager.replacing}
          returnFocusTo={managerTrigger.current}
          onSelect={selectTool}
          onRemove={removeTool}
          onClear={() => {
            consumeCompareDecision();
            clearCompare();
            setManager(null);
            setNotice("");
          }}
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
