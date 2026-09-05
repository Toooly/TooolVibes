"use client";

import { useEffect, useState } from "react";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { useCompareObjective } from "@/lib/hooks/use-compare-objective";
import { MobileCompareView } from "./mobile-compare-view";
import { DesktopCompareView } from "./desktop-compare-view";

export const COMPARE_DESKTOP_MEDIA_QUERY = "(min-width: 1180px)";

type CompareViewport = "mobile" | "desktop";

function CompareViewportFallback() {
  return (
    <div
      className="compare-viewport-fallback"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      Preparazione dell’area di confronto…
    </div>
  );
}

export function ToolBattleView({
  tools,
  objectiveEnabled = true,
  decisionEnabled = true,
  showIntro = true,
}: {
  tools: ToolPublicView[];
  /** Flag B34 (TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED): OFF = contratto base B33. */
  objectiveEnabled?: boolean;
  /** Flag B35 (TOOOLVIBES_COMPARE_DECISION_ENABLED): OFF = il flow termina al verdetto (contratto B34). */
  decisionEnabled?: boolean;
  showIntro?: boolean;
}) {
  // B34 / FLOW-603: lo stato obiettivo resta sopra lo switch responsive.
  // Solo la superficie attiva viene montata, quindi non esistono listener o
  // stati interattivi duplicati; un resize conserva comunque l'obiettivo.
  const { objective, setObjective } = useCompareObjective();
  const [viewport, setViewport] = useState<CompareViewport | null>(null);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setViewport("mobile");
      return;
    }

    const media = window.matchMedia(COMPARE_DESKTOP_MEDIA_QUERY);
    const update = () => setViewport(media.matches ? "desktop" : "mobile");

    update();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const activeView =
    viewport === "mobile" ? (
      <MobileCompareView
        tools={tools}
        objective={objective}
        onObjectiveChange={setObjective}
        objectiveEnabled={objectiveEnabled}
        decisionEnabled={decisionEnabled}
      />
    ) : viewport === "desktop" ? (
      <DesktopCompareView
        tools={tools}
        objective={objective}
        onObjectiveChange={setObjective}
        objectiveEnabled={objectiveEnabled}
        decisionEnabled={decisionEnabled}
      />
    ) : (
      <CompareViewportFallback />
    );

  return (
    <section
      className={`tool-battle-page${showIntro ? "" : " tool-battle-page--embedded"}`}
      aria-labelledby={showIntro ? "tool-battle-title" : undefined}
      aria-label={showIntro ? undefined : "Area di confronto"}
    >
      {showIntro && <header className="tool-battle-page__intro">
        <p className="tool-battle-page__eyebrow">Confronto guidato</p>
        <h1 id="tool-battle-title">Metti a confronto ciò che conta davvero.</h1>
        <p className="tool-battle-page__lede">
          Affianca da due a cinque tool e confronta evidenze,
          casi d&apos;uso, punti di forza e limiti.
        </p>
        <ol className="tool-battle-page__steps" aria-label="Come funziona il confronto">
          <li><span>01</span> Aggiungi</li>
          <li><span>02</span> Confronta</li>
          <li><span>03</span> Decidi</li>
        </ol>
      </header>}
      <div className="tool-battle-page__viewport">{activeView}</div>
    </section>
  );
}
