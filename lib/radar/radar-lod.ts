/**
 * Radar Level of Detail — deterministic overview display budget.
 *
 * WHY (physical iPhone review): at 7G/30G the instrument rendered every raw
 * signal at once and the map saturated into same-colour blobs. A map behaves
 * like a map: OVERVIEW shows macro structure, CLUSTER FOCUS shows one area,
 * SIGNAL FOCUS inspects one signal.
 *
 * TRUTH RULES
 *  - This is a VISUAL budget only. No signal is ever removed from the dataset,
 *    from the tool list, from search, or from the semantic model.
 *  - Selection is fully deterministic: same input -> same plan.
 *  - Aggregated signals keep their EXACT semantic coordinates. Aggregation
 *    changes representation, never geometry (spatial memory is frozen).
 *  - No hardcoded tool slugs anywhere.
 */

import type { RadarCatalogStatus } from "@/lib/radar/radar-domain";
import {
  radarTopicClusterOrder,
  radarTopicClusterSectorIndex,
} from "@/lib/radar/radar-topic-clusters";
import { RADAR_CENTER, RADAR_COMPASS_SECTOR_SPAN_DEG } from "@/lib/radar/radar-geometry";

/** Overview budget — individual real signals shown as their own blips. */
export const RADAR_LOD_BUDGET_MOBILE = 11;
/** Desktop uses the same hierarchy with a larger budget. */
export const RADAR_LOD_BUDGET_DESKTOP = 17;

/**
 * Human-readable statement of the algorithm, rendered nowhere in the UI but
 * asserted by tests and exported so the contract is inspectable.
 */
export const RADAR_LOD_ALGORITHM = [
  "A. the currently selected signal is always individual",
  "B. catalog-linked signals by descending attention",
  "C. the highest-attention signal of every active cluster",
  "D. the newest signal of every active cluster, when different",
  "E. remaining signals by descending attention until the budget is reached",
  "a per-cluster cap stops one large cluster from consuming the overview",
  "everything left over becomes one aggregate +N node per cluster",
].join("; ");

export type RadarLodInput = {
  id: string;
  clusterId: string;
  /** Real attention: votes + comments. */
  attention: number;
  /** Hours since launch; null when unknown (treated as newest for ordering). */
  ageHours: number | null;
  catalogStatus: RadarCatalogStatus;
  /** Semantic angle in degrees (0 = up, clockwise). Pre-collision is fine. */
  semanticAngleDeg: number;
  /** Semantic radius ratio 0..1 (age). Never changed by aggregation. */
  radiusRatio: number;
};

export type RadarAggregate = {
  /** Stable synthetic id: `agg:<clusterId>`. Never a Tool identity. */
  id: string;
  clusterId: string;
  label: string;
  /** Number of real signals represented by this stack. */
  count: number;
  /** The real signal ids inside the stack (order-stable). */
  memberIds: readonly string[];
  /** Deterministic position inside the owning sector. */
  x: number;
  y: number;
  radiusRatio: number;
  semanticAngleDeg: number;
};

export type RadarLodPlan = {
  /** Ids rendered as individual real signals in Overview. */
  individualIds: ReadonlySet<string>;
  /** One aggregate per cluster that has leftovers. */
  aggregates: readonly RadarAggregate[];
  budget: number;
  /** Per-cluster cap applied to phases B–E. */
  perClusterCap: number;
  algorithm: string;
};

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function toXY(semanticAngleDeg: number, radiusRatio: number, outerRadius: number) {
  const angle = ((semanticAngleDeg - 90) * Math.PI) / 180;
  const distance = outerRadius * radiusRatio;
  return {
    x: RADAR_CENTER + distance * Math.cos(angle),
    y: RADAR_CENTER + distance * Math.sin(angle),
  };
}

/**
 * Deterministic Overview LOD plan.
 *
 * Phases A-E are executed in order. Ties always break on ascending id, so the
 * plan is identical on every machine and every run.
 */
export function planRadarLod(
  items: readonly RadarLodInput[],
  options: {
    budget?: number;
    selectedId?: string | null;
    outerRadius?: number;
  } = {},
): RadarLodPlan {
  const budget = Math.max(1, options.budget ?? RADAR_LOD_BUDGET_MOBILE);
  const outerRadius = options.outerRadius ?? 42;
  const selectedId = options.selectedId ?? null;

  const byId = new Map(items.map((item) => [item.id, item]));
  const clusters = Array.from(new Set(items.map((item) => item.clusterId)));
  // Compass order keeps the plan stable regardless of dataset iteration order.
  const compass = radarTopicClusterOrder().filter((id) => clusters.includes(id));
  const clusterCount = Math.max(compass.length, 1);
  const perClusterCap = Math.max(2, Math.ceil(budget / clusterCount));

  const chosen = new Map<string, RadarLodInput>();
  const clusterTally = new Map<string, number>();

  const tryAdd = (item: RadarLodInput | undefined, opts?: { ignoreCap?: boolean }) => {
    if (!item || chosen.has(item.id)) return;
    if (chosen.size >= budget) return;
    const used = clusterTally.get(item.clusterId) ?? 0;
    if (!opts?.ignoreCap && used >= perClusterCap) return;
    chosen.set(item.id, item);
    clusterTally.set(item.clusterId, used + 1);
  };

  // A. the selected signal is always individual, cap or no cap.
  if (selectedId) {
    const selected = byId.get(selectedId);
    if (selected) tryAdd(selected, { ignoreCap: true });
  }

  // B. catalog-linked signals, strongest attention first.
  const linked = items
    .filter((item) => item.catalogStatus === "linked")
    .sort((a, b) => b.attention - a.attention || a.id.localeCompare(b.id));
  for (const item of linked) tryAdd(item);

  // C. highest-attention signal of every active cluster.
  for (const clusterId of compass) {
    const members = items
      .filter((item) => item.clusterId === clusterId)
      .sort((a, b) => b.attention - a.attention || a.id.localeCompare(b.id));
    tryAdd(members[0]);
  }

  // D. newest signal of every active cluster, when it is a different signal.
  for (const clusterId of compass) {
    const members = items
      .filter((item) => item.clusterId === clusterId)
      .sort((a, b) => {
        const ageA = a.ageHours ?? Number.NEGATIVE_INFINITY;
        const ageB = b.ageHours ?? Number.NEGATIVE_INFINITY;
        if (ageA !== ageB) return ageA - ageB;
        return a.id.localeCompare(b.id);
      });
    tryAdd(members[0]);
  }

  // E. remaining by descending attention until the budget is reached.
  const remaining = items
    .filter((item) => !chosen.has(item.id))
    .sort((a, b) => b.attention - a.attention || a.id.localeCompare(b.id));
  for (const item of remaining) tryAdd(item);

  // Deterministic safety valve: if the cap left the budget unfilled, relax it
  // and keep filling strongest-first. Still fully deterministic.
  if (chosen.size < budget) {
    for (const item of remaining) {
      if (chosen.size >= budget) break;
      if (chosen.has(item.id)) continue;
      chosen.set(item.id, item);
      clusterTally.set(item.clusterId, (clusterTally.get(item.clusterId) ?? 0) + 1);
    }
  }

  // Aggregate everything that did not make the cut, one stack per cluster.
  const aggregates: RadarAggregate[] = [];
  for (const clusterId of compass) {
    const leftovers = items
      .filter((item) => item.clusterId === clusterId && !chosen.has(item.id))
      .sort((a, b) => a.id.localeCompare(b.id));
    if (leftovers.length === 0) continue;

    const radiusRatio = median(leftovers.map((item) => item.radiusRatio));
    const semanticAngleDeg = median(
      leftovers.map((item) => item.semanticAngleDeg),
    );
    const { x, y } = toXY(semanticAngleDeg, radiusRatio, outerRadius);

    aggregates.push({
      id: `agg:${clusterId}`,
      clusterId,
      label: "",
      count: leftovers.length,
      memberIds: leftovers.map((item) => item.id),
      x,
      y,
      radiusRatio,
      semanticAngleDeg,
    });
  }

  return {
    individualIds: new Set(chosen.keys()),
    aggregates,
    budget,
    perClusterCap,
    algorithm: RADAR_LOD_ALGORITHM,
  };
}

/**
 * Aggregate a11y label: "5 altri segnali in Sviluppo & Coding".
 * The node is never presented as a Tool.
 */
export function radarAggregateLabel(count: number, clusterLabel: string): string {
  return `${count} altri segnali in ${clusterLabel}`;
}

/**
 * Cluster Focus: which signals render individually when one cluster is open.
 * Every member of the focused cluster is shown at its EXISTING coordinates;
 * the aggregate for that cluster disappears (no nested aggregation).
 */
export function radarClusterFocusMembers(
  items: readonly RadarLodInput[],
  clusterId: string,
): ReadonlySet<string> {
  return new Set(
    items.filter((item) => item.clusterId === clusterId).map((item) => item.id),
  );
}

/** Per-cluster cap helper exported for tests and documentation. */
export function radarLodPerClusterCap(
  budget: number,
  activeClusterCount: number,
): number {
  return Math.max(2, Math.ceil(budget / Math.max(activeClusterCount, 1)));
}

/** Compass span re-export so callers need one import. */
export const RADAR_LOD_SECTOR_SPAN_DEG = RADAR_COMPASS_SECTOR_SPAN_DEG;
export { radarTopicClusterSectorIndex };


/**
 * CLUSTER FOCUS plan (progressive detail, one level deep — never nested).
 *
 * A focused cluster paints ALL of its real signals at their EXISTING semantic
 * coordinates. Every other active cluster contributes exactly ONE contextual
 * node so the compass stays legible without re-blooming the map:
 *   - its Overview `+N` aggregate when it has one, else
 *   - at most its canonical Overview representative (highest attention).
 *
 * Context nodes are dimmed and NON-INTERACTIVE. Context is never a second
 * focus level.
 *
 * INVARIANT (§2 — no duplicate representation): a signal is never painted both
 * as an individual node and inside a visible aggregate in the same state.
 * `duplicateRepresentationCount` is computed from the plan and must be 0.
 */
export type RadarClusterFocusPlan = {
  /** Every real signal of the focused cluster. All interactive. */
  focusedIds: ReadonlySet<string>;
  /** One representative per other cluster that has no aggregate. */
  contextIds: ReadonlySet<string>;
  /** One `+N` stack per other cluster that has leftovers in Overview. */
  contextAggregates: readonly RadarAggregate[];
  /** Everything painted in this state. */
  visibleIds: ReadonlySet<string>;
  /** Interactive ids — the focused cluster only (§6). */
  interactiveIds: ReadonlySet<string>;
  /** Focused signals + context nodes. */
  visibleNodeCount: number;
  contextNodeCount: number;
  /** Always 0 — asserted explicitly so it can never regress. */
  duplicateRepresentationCount: number;
};

export function planRadarClusterFocus(
  items: readonly RadarLodInput[],
  clusterId: string,
  overview: RadarLodPlan,
): RadarClusterFocusPlan {
  const focusedIds = new Set<string>();
  for (const item of items) {
    if (item.clusterId === clusterId) focusedIds.add(item.id);
  }

  const overviewAggregateByCluster = new Map<string, RadarAggregate>();
  for (const aggregate of overview.aggregates) {
    overviewAggregateByCluster.set(aggregate.clusterId, aggregate);
  }

  const contextAggregates: RadarAggregate[] = [];
  const contextIds = new Set<string>();
  const activeClusters = new Set(items.map((item) => item.clusterId));

  for (const active of radarTopicClusterOrder()) {
    if (!activeClusters.has(active) || active === clusterId) continue;
    const aggregate = overviewAggregateByCluster.get(active);
    if (aggregate) {
      // §5 — show the `+N` stack and NOTHING else from that cluster.
      contextAggregates.push(aggregate);
      continue;
    }
    // §5 — no aggregate: at most its canonical Overview representative.
    const candidates = items.filter(
      (item) => item.clusterId === active && overview.individualIds.has(item.id),
    );
    const pool = candidates.length > 0
      ? candidates
      : items.filter((item) => item.clusterId === active);
    const pick = [...pool].sort(
      (a, b) =>
        b.attention - a.attention ||
        (a.ageHours ?? Number.POSITIVE_INFINITY) - (b.ageHours ?? Number.POSITIVE_INFINITY) ||
        a.id.localeCompare(b.id),
    )[0];
    if (pick) contextIds.add(pick.id);
  }

  const visibleIds = new Set<string>([...focusedIds, ...contextIds]);
  const interactiveIds = new Set<string>(focusedIds);

  // §2 invariant — computed, not assumed.
  const aggregated = new Set<string>();
  for (const aggregate of contextAggregates) {
    for (const member of aggregate.memberIds) aggregated.add(member);
  }
  let duplicateRepresentationCount = 0;
  for (const id of visibleIds) {
    if (aggregated.has(id)) duplicateRepresentationCount += 1;
  }

  return {
    focusedIds,
    contextIds,
    contextAggregates,
    visibleIds,
    interactiveIds,
    visibleNodeCount: focusedIds.size + contextIds.size + contextAggregates.length,
    contextNodeCount: contextIds.size + contextAggregates.length,
    duplicateRepresentationCount,
  };
}
