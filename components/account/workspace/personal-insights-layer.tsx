"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "@/components/ui/app-link";

import { useAccount } from "@/components/account/account-provider";
import { useAuthContinuation } from "@/components/account/auth-continuation-provider";
import {
  derivePersonalInsights,
  MAX_COMPARE_INSIGHTS,
  MAX_TOOL_PAGE_INSIGHTS,
  type PersonalInsight,
} from "@/lib/account/personal-insights";
import { usePersonalInsightLayerOpen } from "@/lib/auth/personal-insight-layer-state";
import { canUse } from "@/lib/capabilities";
import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import { getCanonicalToolWorkspaceState } from "@/lib/stores/tool-workspace-store";

import "./personal-insights-layer.css";

function catalogHints(tools: ReturnType<typeof usePublicToolCatalog>) {
  return tools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    categoryLabel: tool.categoryLabel,
  }));
}

export function useToolPersonalInsights(slug: string, limit = MAX_TOOL_PAGE_INSIGHTS) {
  const snapshot = useDiscoverySnapshot();
  const catalog = usePublicToolCatalog();
  return useMemo(() => {
    void snapshot;
    return derivePersonalInsights({
      toolSlug: slug,
      workspace: getCanonicalToolWorkspaceState(),
      catalog: catalogHints(catalog),
      limit,
    });
  }, [snapshot, slug, catalog, limit]);
}

export function PersonalInsightsLayer({
  slug,
  origin = "tool",
}: {
  slug: string;
  origin?: "tool" | "compare";
}) {
  const account = useAccount();
  const continuation = useAuthContinuation();
  const insights = useToolPersonalInsights(slug);
  const { open } = usePersonalInsightLayerOpen(slug);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    rootRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);

  if (account.status === "loading" || account.status === "unavailable") return null;

  const viewer = account.status === "authenticated" ? "authenticated" : "guest";
  if (!canUse("insight.personal", viewer)) {
    return (
      <div className="tv-insights" data-origin={origin} data-state="guest" ref={rootRef}>
        <button
          type="button"
          className="tv-insights__trigger"
          onClick={() => {
            continuation.requestInsightPersonal({
              toolSlug: slug,
              origin: `insight.${origin}`,
            });
          }}
        >
          Per te
        </button>
      </div>
    );
  }

  if (insights.length === 0 && !open) return null;

  return (
    <section
      ref={rootRef}
      className="tv-insights"
      data-origin={origin}
      data-state={insights.length ? "ready" : "empty"}
      data-personal-insights=""
      aria-labelledby={`tv-insights-title-${slug}`}
    >
      <h2 className="tv-insights__title" id={`tv-insights-title-${slug}`}>
        Per te
      </h2>
      {insights.length === 0 ? (
        <p className="tv-insights__empty">Nessun contesto personale ancora.</p>
      ) : (
        <ul className="tv-insights__list">
          {insights.map((item) => (
            <InsightRow key={item.id} insight={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function InsightRow({ insight }: { insight: PersonalInsight }) {
  return (
    <li className="tv-insights__item" data-insight-type={insight.type} data-insight-id={insight.id}>
      <p className="tv-insights__kicker">{insight.title}</p>
      <p className="tv-insights__text">{insight.explanation}</p>
      {insight.action ? (
        <Link className="tv-insights__action" href={insight.action.href}>
          {insight.action.label}
        </Link>
      ) : null}
    </li>
  );
}

export function CompareInsightLine({
  slug,
  names,
}: {
  slug: string;
  names: Record<string, string>;
}) {
  const account = useAccount();
  const snapshot = useDiscoverySnapshot();
  const catalog = usePublicToolCatalog();
  const insight = useMemo(() => {
    void snapshot;
    const hints = catalogHints(catalog);
    for (const [itemSlug, name] of Object.entries(names)) {
      if (!hints.some((tool) => tool.slug === itemSlug)) {
        hints.push({ slug: itemSlug, name, categoryLabel: "" });
      }
    }
    return derivePersonalInsights({
      toolSlug: slug,
      workspace: getCanonicalToolWorkspaceState(),
      catalog: hints,
      limit: MAX_COMPARE_INSIGHTS,
    })[0] ?? null;
  }, [snapshot, slug, catalog, names]);

  if (account.status !== "authenticated") return null;
  if (!insight) return null;

  return (
    <p
      className="compare-insight"
      data-compare-insight=""
      data-insight-type={insight.type}
    >
      {insight.explanation}
    </p>
  );
}
