import type { ToolPublic } from "@/lib/types/tool-public";
import type { ToolPublicView } from "@/lib/data/tool-public-view";

export const publicToolsSourceValues = [
  "directory",
  "supabase",
  "mock",
] as const;

export type PublicToolsDataSource = (typeof publicToolsSourceValues)[number];
export type PublicToolsSnapshotStatus = "ready" | "empty" | "unavailable";
export type PublicToolsFailureReason =
  | "source-not-configured"
  | "source-read-failed"
  | "source-invalid"
  | "duplicate-slug"
  | "mock-disabled";

export type PublicToolsSourcePayload = {
  tools: ToolPublicView[];
};

export type PublicToolsComparison = {
  source: PublicToolsDataSource;
  status: PublicToolsSnapshotStatus;
  activeCount: number;
  comparisonCount: number;
  overlapCount: number;
  activeOnlyCount: number;
  comparisonOnlyCount: number;
  fieldMismatchCount: number;
};

export type PublicToolsSnapshot = {
  tools: ToolPublic[];
  views: ToolPublicView[];
  source: PublicToolsDataSource | null;
  requestedSource: PublicToolsDataSource;
  fallbackSource: PublicToolsDataSource | null;
  status: PublicToolsSnapshotStatus;
  failureReason: PublicToolsFailureReason | null;
  warnings: string[];
  comparison: PublicToolsComparison | null;
};

export type PublicToolsRuntimePolicy = {
  environment: "production" | "development" | "test";
  sourceConfigured: boolean;
  requestedSource: PublicToolsDataSource;
  fallbackSource: PublicToolsDataSource | null;
  comparisonSource: PublicToolsDataSource | null;
  mockEnabled: boolean;
  warnings: string[];
};

export type PublicToolsEnvironment = {
  NODE_ENV?: string;
  TOOOLVIBES_TOOLS_SOURCE?: string;
  TOOOLVIBES_TOOLS_FALLBACK?: string;
  TOOOLVIBES_TOOLS_COMPARE_SOURCE?: string;
  TOOOLVIBES_ALLOW_MOCK_DATA?: string;
};

export type PublicToolsSourceLoaders = Record<
  PublicToolsDataSource,
  () => Promise<PublicToolsSourcePayload>
>;

export type PublicToolsTelemetryEvent =
  | {
      event: "source-resolution";
      requestedSource: PublicToolsDataSource;
      activeSource: PublicToolsDataSource | null;
      fallbackSource: PublicToolsDataSource | null;
      status: PublicToolsSnapshotStatus;
      count: number;
      failureReason: PublicToolsFailureReason | null;
    }
  | ({ event: "source-comparison" } & PublicToolsComparison);

export class PublicToolsSourceError extends Error {
  constructor(
    public readonly reason: PublicToolsFailureReason,
    message: string = reason,
  ) {
    super(message);
    this.name = "PublicToolsSourceError";
  }
}

export class PublicToolsUnavailableError extends Error {
  constructor(public readonly snapshot: PublicToolsSnapshot) {
    super(
      `Public tools source ${snapshot.requestedSource} is unavailable (${snapshot.failureReason ?? "unknown"}).`,
    );
    this.name = "PublicToolsUnavailableError";
  }
}

function parseSource(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return publicToolsSourceValues.find((source) => source === normalized) ?? null;
}

function normalizeEnvironment(value: string | undefined) {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

export function getPublicToolsRuntimePolicy(
  environment: PublicToolsEnvironment,
): PublicToolsRuntimePolicy {
  const nodeEnvironment = normalizeEnvironment(environment.NODE_ENV);
  const configuredSource = environment.TOOOLVIBES_TOOLS_SOURCE;
  const parsedSource = parseSource(configuredSource);
  const requestedSource = parsedSource ?? "directory";
  const warnings: string[] = [];

  if (configuredSource?.trim() && !parsedSource) {
    warnings.push("tools-source-invalid");
  }
  if (nodeEnvironment === "production" && !parsedSource) {
    warnings.push("tools-source-required-in-production");
  }


  const configuredFallback = environment.TOOOLVIBES_TOOLS_FALLBACK
    ?.trim()
    .toLowerCase();
  const parsedFallback =
    configuredFallback === "none" ? null : parseSource(configuredFallback);
  let fallbackSource =
    nodeEnvironment === "production" ? null : parsedFallback;

  if (
    configuredFallback &&
    configuredFallback !== "none" &&
    !parsedFallback
  ) {
    warnings.push("tools-fallback-invalid");
  }

  if (nodeEnvironment === "production" && parsedFallback) {
    warnings.push("tools-fallback-disabled-in-production");
  }

  if (fallbackSource === requestedSource) {
    fallbackSource = null;
    warnings.push("tools-fallback-matches-primary");
  }

  const configuredComparison = environment.TOOOLVIBES_TOOLS_COMPARE_SOURCE
    ?.trim()
    .toLowerCase();
  const parsedComparison =
    configuredComparison === "none" ? null : parseSource(configuredComparison);
  let comparisonSource = parsedComparison;

  if (
    configuredComparison &&
    configuredComparison !== "none" &&
    !parsedComparison
  ) {
    warnings.push("tools-comparison-source-invalid");
  }

  if (comparisonSource === requestedSource) {
    comparisonSource = null;
    warnings.push("tools-comparison-matches-primary");
  }

  return {
    environment: nodeEnvironment,
    sourceConfigured: Boolean(parsedSource),
    requestedSource,
    fallbackSource,
    comparisonSource,
    mockEnabled: environment.TOOOLVIBES_ALLOW_MOCK_DATA === "1",
    warnings,
  };
}

function validateSourcePayload(payload: PublicToolsSourcePayload) {
  const slugCounts = new Map<string, number>();

  for (const view of payload.tools) {
    if (view.slug !== view.publicTool.slug) {
      throw new PublicToolsSourceError(
        "source-invalid",
        "Tool view and canonical slug differ.",
      );
    }

    slugCounts.set(view.slug, (slugCounts.get(view.slug) ?? 0) + 1);
  }

  if ([...slugCounts.values()].some((count) => count > 1)) {
    throw new PublicToolsSourceError("duplicate-slug");
  }

  return payload.tools.filter(
    (view) => view.publicTool.publication.status === "published",
  );
}

function errorReason(error: unknown): PublicToolsFailureReason {
  if (error instanceof PublicToolsSourceError) {
    return error.reason;
  }

  return "source-read-failed";
}

async function loadSource(
  source: PublicToolsDataSource,
  policy: PublicToolsRuntimePolicy,
  loaders: PublicToolsSourceLoaders,
) {
  if (source === "mock" && !policy.mockEnabled) {
    throw new PublicToolsSourceError("mock-disabled");
  }

  return validateSourcePayload(await loaders[source]());
}

function canonicalFingerprint(tool: ToolPublic) {
  return JSON.stringify(tool);
}

export function comparePublicToolSources(
  activeTools: ToolPublicView[],
  comparisonTools: ToolPublicView[],
  source: PublicToolsDataSource,
): PublicToolsComparison {
  const active = new Map(
    activeTools.map((view) => [view.slug, canonicalFingerprint(view.publicTool)]),
  );
  const comparison = new Map(
    comparisonTools.map((view) => [
      view.slug,
      canonicalFingerprint(view.publicTool),
    ]),
  );
  const overlap = [...active.keys()].filter((slug) => comparison.has(slug));

  return {
    source,
    status: comparisonTools.length > 0 ? "ready" : "empty",
    activeCount: active.size,
    comparisonCount: comparison.size,
    overlapCount: overlap.length,
    activeOnlyCount: [...active.keys()].filter((slug) => !comparison.has(slug))
      .length,
    comparisonOnlyCount: [...comparison.keys()].filter(
      (slug) => !active.has(slug),
    ).length,
    fieldMismatchCount: overlap.filter(
      (slug) => active.get(slug) !== comparison.get(slug),
    ).length,
  };
}

function buildSnapshot({
  views,
  source,
  policy,
  fallbackSource = null,
  failureReason = null,
  warnings,
  comparison = null,
}: {
  views: ToolPublicView[];
  source: PublicToolsDataSource | null;
  policy: PublicToolsRuntimePolicy;
  fallbackSource?: PublicToolsDataSource | null;
  failureReason?: PublicToolsFailureReason | null;
  warnings: string[];
  comparison?: PublicToolsComparison | null;
}): PublicToolsSnapshot {
  return {
    tools: views.map((view) => view.publicTool),
    views,
    source,
    requestedSource: policy.requestedSource,
    fallbackSource,
    status: source === null ? "unavailable" : views.length > 0 ? "ready" : "empty",
    failureReason,
    warnings,
    comparison,
  };
}

export async function resolvePublicToolsSnapshot({
  policy,
  loaders,
  telemetry,
}: {
  policy: PublicToolsRuntimePolicy;
  loaders: PublicToolsSourceLoaders;
  telemetry?: (event: PublicToolsTelemetryEvent) => void;
}): Promise<PublicToolsSnapshot> {
  const warnings = [...policy.warnings];
  let activeViews: ToolPublicView[] = [];
  let activeSource: PublicToolsDataSource | null = policy.requestedSource;
  let fallbackSource: PublicToolsDataSource | null = null;
  let failureReason: PublicToolsFailureReason | null = null;

  if (policy.environment === "production" && !policy.sourceConfigured) {
    activeSource = null;
    failureReason = "source-not-configured";
    warnings.push("tools-production-source-not-configured");
  }

  try {
    if (activeSource === null) {
      throw new PublicToolsSourceError("source-not-configured");
    }

    activeViews = await loadSource(policy.requestedSource, policy, loaders);
  } catch (error) {
    failureReason = errorReason(error);
    warnings.push(`tools-${policy.requestedSource}-${failureReason}`);
    activeSource = null;

    if (policy.fallbackSource) {
      try {
        activeViews = await loadSource(policy.fallbackSource, policy, loaders);
        activeSource = policy.fallbackSource;
        fallbackSource = policy.fallbackSource;
        failureReason = null;
        warnings.push("tools-explicit-fallback-active");
      } catch (fallbackError) {
        const fallbackFailureReason = errorReason(fallbackError);
        warnings.push(
          `tools-${policy.fallbackSource}-${fallbackFailureReason}`,
        );
      }
    }
  }

  let comparison: PublicToolsComparison | null = null;
  if (activeSource && policy.comparisonSource) {
    try {
      const comparisonViews = await loadSource(
        policy.comparisonSource,
        policy,
        loaders,
      );
      comparison = comparePublicToolSources(
        activeViews,
        comparisonViews,
        policy.comparisonSource,
      );
      telemetry?.({ event: "source-comparison", ...comparison });
    } catch (error) {
      warnings.push(
        `tools-${policy.comparisonSource}-comparison-${errorReason(error)}`,
      );
    }
  }

  const snapshot = buildSnapshot({
    views: activeViews,
    source: activeSource,
    policy,
    fallbackSource,
    failureReason,
    warnings,
    comparison,
  });

  telemetry?.({
    event: "source-resolution",
    requestedSource: policy.requestedSource,
    activeSource: snapshot.source,
    fallbackSource: snapshot.fallbackSource,
    status: snapshot.status,
    count: snapshot.tools.length,
    failureReason: snapshot.failureReason,
  });

  return snapshot;
}

export function requirePublicToolsSnapshot(snapshot: PublicToolsSnapshot) {
  if (snapshot.status === "unavailable") {
    throw new PublicToolsUnavailableError(snapshot);
  }

  return snapshot;
}
