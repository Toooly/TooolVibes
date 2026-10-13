"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useEffect, useMemo, useState } from "react";

import { useAccount } from "@/components/account/account-provider";
import { useAuthContinuation } from "@/components/account/auth-continuation-provider";
import { canUse } from "@/lib/capabilities";
import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { ProductHuntItem } from "@/lib/radar/product-hunt-contract";
import {
  listRadarPersonalSignals,
  radarPersonalByItemId,
  type RadarPersonalSignal,
} from "@/lib/radar/radar-personal-signals";
import {
  subscribeRadarPersonalOpen,
  takeRadarPersonalOpen,
} from "@/lib/radar/radar-personal-resume";
import { getCanonicalToolWorkspaceState } from "@/lib/stores/tool-workspace-store";

export type RadarLens = "public" | "personal";

export function useRadarPersonalLayer(items: readonly ProductHuntItem[]) {
  const account = useAccount();
  const continuation = useAuthContinuation();
  const catalog = usePublicToolCatalog();
  const snapshot = useDiscoverySnapshot();
  const [lens, setLens] = useState<RadarLens>("public");

  useEffect(() => {
    const apply = () => {
      if (takeRadarPersonalOpen() && account.status === "authenticated") {
        setLens("personal");
      }
    };
    apply();
    return subscribeRadarPersonalOpen(apply);
  }, [account.status]);

  const signals = useMemo(() => {
    void snapshot;
    if (account.status !== "authenticated") return [] as RadarPersonalSignal[];
    return listRadarPersonalSignals({
      items,
      workspace: getCanonicalToolWorkspaceState(),
      catalog,
    });
  }, [account.status, catalog, items, snapshot]);

  const byId = useMemo(() => radarPersonalByItemId(signals), [signals]);

  function selectLens(next: RadarLens) {
    if (next === "public") {
      setLens("public");
      return;
    }
    if (account.status === "loading" || account.status === "unavailable") return;
    const viewer = account.status === "authenticated" ? "authenticated" : "guest";
    if (!canUse("radar.personal", viewer)) {
      continuation.requestRadarPersonal({ origin: "radar.personal", returnTo: "/radar" });
      return;
    }
    setLens("personal");
  }

  return {
    accountStatus: account.status,
    lens,
    selectLens,
    signals,
    byId,
    showLens: account.status === "guest" || account.status === "authenticated",
  };
}

export function RadarLensControl({
  lens,
  onSelect,
  visible,
}: {
  lens: RadarLens;
  onSelect: (lens: RadarLens) => void;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      className="tv-radar-control"
      role="tablist"
      aria-labelledby="tv-radar-lens-label"
      data-radar-lens=""
    >
      <span id="tv-radar-lens-label" className="tv-radar-control__label"><LocalizedText>{"Lente "}</LocalizedText></span>
      <div className="tv-radar-control__buttons">
        <button
          type="button"
          role="tab"
          aria-selected={lens === "public"}
          aria-controls="tv-radar-results"
          onClick={() => onSelect("public")}
        ><LocalizedText>{"Tendenze "}</LocalizedText></button>
        <button
          type="button"
          role="tab"
          data-radar-lens-personal=""
          aria-selected={lens === "personal"}
          aria-controls="tv-radar-results"
          onClick={() => onSelect("personal")}
        ><LocalizedText>{"Per te "}</LocalizedText></button>
      </div>
    </div>
  );
}

export function RadarPersonalReason({
  signal,
}: {
  signal: RadarPersonalSignal | undefined;
}) {
  if (!signal) return null;
  return (
    <p className="tv-radar-personal-reason" data-radar-personal-reason={signal.kind}>
      <span className="tv-radar-personal-reason__eyebrow"><LocalizedText>{"Per te"}</LocalizedText></span>
      <LocalizedText>{signal.explanation}</LocalizedText>
    </p>
  );
}

export function RadarPersonalEmpty() {
  return (
    <div
      className="tv-radar-state"
      data-variant="empty"
      data-radar-personal-empty=""
      role="status"
      aria-live="polite"
    >
      <h3 className="tv-radar-state__title"><LocalizedText>{"Nessun segnale personale forte in questo momento."}</LocalizedText></h3>
      <p className="tv-radar-state__body"><LocalizedText>{"Il Radar resta sulle tendenze pubbliche. Torna alle tendenze per continuare a esplorare i lanci. "}</LocalizedText></p>
    </div>
  );
}
