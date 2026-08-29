"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useAccount } from "@/components/account/account-provider";
import { useAuthContinuation } from "@/components/account/auth-continuation-provider";
import { canUse } from "@/lib/capabilities";
import {
  comparePersonalL1Chips,
  comparePersonalL2Lines,
  listComparePersonalContexts,
  type ComparePersonalContext,
} from "@/lib/compare/compare-personal-context";
import {
  subscribeDeepCompareOpen,
  takeDeepCompareOpen,
} from "@/lib/compare/deep-compare-resume";
import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { getCanonicalToolWorkspaceState } from "@/lib/stores/tool-workspace-store";

export function useComparePersonalContexts(
  slugs: readonly string[],
  names: Record<string, string>,
) {
  const snapshot = useDiscoverySnapshot();
  return useMemo(() => {
    void snapshot;
    const nameOf = (slug: string) => names[slug] ?? slug;
    return listComparePersonalContexts(
      getCanonicalToolWorkspaceState(),
      slugs,
      nameOf,
    );
  }, [snapshot, slugs, names]);
}

export function CompareDeepEntry({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  const account = useAccount();
  const continuation = useAuthContinuation();
  if (!enabled) return null;
  if (account.status === "loading" || account.status === "unavailable") return null;
  const viewer = account.status === "authenticated" ? "authenticated" : "guest";
  if (canUse("compare.deep", viewer)) return null;

  return (
    <button
      type="button"
      className="compare-deep-entry"
      data-compare-deep-entry=""
      onClick={() => {
        continuation.requestCompareDeep({ origin: "compare.deep" });
      }}
    >
      Il tuo contesto
    </button>
  );
}

export function ComparePersonalStrip({
  context,
  defaultOpen = false,
}: {
  context: ComparePersonalContext;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  if (!context.hasPersonalFact) return null;

  const chips = comparePersonalL1Chips(context);
  const lines = comparePersonalL2Lines(context);
  const detailsId = `compare-deep-${context.toolSlug}`;

  return (
    <div
      className="compare-personal"
      data-compare-personal=""
      data-slug={context.toolSlug}
    >
      <p className="compare-personal__eyebrow">Il tuo contesto</p>
      {chips.length > 0 ? (
        <ul className="compare-personal__chips">
          {chips.map((chip) => (
            <li key={chip.key} className="compare-personal__chip" data-chip={chip.key}>
              {chip.label}
            </li>
          ))}
        </ul>
      ) : null}
      {lines.length > 0 ? (
        <div>
          <button
            type="button"
            className="compare-personal__toggle"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((current) => !current)}
          >
            Nel tuo spazio
          </button>
          {open ? (
            <div id={detailsId} className="compare-personal__l2">
              {lines.map((line) => (
                <p key={line.key} data-l2={line.key}>
                  {line.label}
                </p>
              ))}
              <Link className="compare-personal__link" href={`/toools/${context.toolSlug}`}>
                Apri tool
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ComparePersonalLayer({
  slugs,
  names,
}: {
  slugs: readonly string[];
  names: Record<string, string>;
}) {
  const account = useAccount();
  const contexts = useComparePersonalContexts(slugs, names);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    if (takeDeepCompareOpen()) setForceOpen(true);
    return subscribeDeepCompareOpen(() => {
      if (takeDeepCompareOpen()) setForceOpen(true);
    });
  }, []);

  if (account.status !== "authenticated") return null;

  const anyFact = contexts.some((context) => context.hasPersonalFact);
  if (!anyFact && !forceOpen) return null;

  return (
    <section
      className="compare-personal-layer"
      data-compare-personal-layer=""
      data-open={forceOpen ? "true" : "false"}
      aria-label="Il tuo contesto"
    >
      {!anyFact ? (
        <p className="compare-personal__empty">Nessun contesto personale ancora.</p>
      ) : null}
      {contexts.map((context) => (
        <ComparePersonalStrip
          key={context.toolSlug}
          context={context}
          defaultOpen={forceOpen}
        />
      ))}
    </section>
  );
}
