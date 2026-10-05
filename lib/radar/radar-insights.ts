/**
 * Deterministic Radar insights ("Insight di oggi").
 *
 * Every claim is computed from the current snapshot with an explicit rule.
 * NO LLM copy. NO fabricated market facts. If a claim cannot be computed the
 * insight is simply not emitted.
 */

import type { RadarView } from "@/lib/radar/radar-domain";

export type RadarInsight = {
  id: string;
  title: string;
  body: string;
  /** Encoded so every card deep-links into a filtered Radar state. */
  link: { category?: string; tab?: string };
};

export function buildRadarInsights(view: RadarView): RadarInsight[] {
  const insights: RadarInsight[] = [];
  const { tools, categories } = view;

  if (tools.length === 0) return insights;

  // Rule 1: dominant category share (only when there are ≥ 3 tools and a
  // single category holds ≥ 40% of the snapshot).
  const rankedCategories = categories
    .filter((category) => category.id !== "altri-segnali")
    .slice()
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  const topCategory = rankedCategories[0];
  if (topCategory && tools.length >= 3) {
    const share = Math.round((topCategory.count / tools.length) * 100);
    if (share >= 40) {
      insights.push({
        id: `share:${topCategory.id}`,
        title: `${topCategory.label} pesa il ${share}%`,
        body: `${topCategory.count} su ${tools.length} segnali del periodo appartengono a ${topCategory.label}.`,
        link: { category: topCategory.id, tab: "panoramica" },
      });
    }
  }

  // Rule 2: high-attention threshold crossing (real votes count).
  const highAttention = tools.filter((tool) => tool.votesCount >= 100);
  if (highAttention.length > 0) {
    insights.push({
      id: "attention:100",
      title: `${highAttention.length} ${highAttention.length === 1 ? "tool supera" : "tool superano"} i 100 voti`,
      body: `Attenzione alta nel periodo: ${highAttention
        .slice(0, 3)
        .map((tool) => tool.name)
        .join(", ")}${highAttention.length > 3 ? " e altri" : ""}.`,
      link: { tab: "trend" },
    });
  }

  // Rule 3: discussion density (real comments).
  const totalComments = tools.reduce((sum, tool) => sum + tool.commentsCount, 0);
  const mostDiscussed = tools
    .slice()
    .sort((a, b) => b.commentsCount - a.commentsCount)[0];
  if (mostDiscussed && mostDiscussed.commentsCount > 0 && totalComments > 0) {
    const share = Math.round((mostDiscussed.commentsCount / totalComments) * 100);
    insights.push({
      id: `discussion:${mostDiscussed.id}`,
      title: `${mostDiscussed.name} concentra il ${share}% dei commenti`,
      body: `${mostDiscussed.commentsCount} commenti su ${totalComments} nel periodo selezionato.`,
      link: { tab: "trend" },
    });
  }

  // Rule 4: real new launches inside the window (needs launchedAt).
  const fresh = tools.filter(
    (tool) => tool.ageHours !== null && tool.ageHours <= 24,
  );
  if (fresh.length > 0) {
    insights.push({
      id: "fresh:24h",
      title: `${fresh.length} ${fresh.length === 1 ? "lancio nelle ultime 24h" : "lanci nelle ultime 24h"}`,
      body: fresh
        .slice(0, 3)
        .map((tool) => tool.name)
        .join(", "),
      link: { tab: "trend" },
    });
  }

  return insights.slice(0, 4);
}
