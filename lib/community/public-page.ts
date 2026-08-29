import {
  COMMUNITY_DURATION_BUCKETS,
  type CommunityExperiencePublic,
  type DurationBucket,
} from "@/lib/community/schema";

function isDuration(value: unknown): value is DurationBucket {
  return (
    typeof value === "string" &&
    (COMMUNITY_DURATION_BUCKETS as readonly string[]).includes(value)
  );
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) return null;
  const items = value.filter((item): item is string => typeof item === "string");
  return items.length === value.length ? items : null;
}

export function parsePublicExperience(value: unknown): CommunityExperiencePublic | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const pros = asStringList(row.pros);
  const limits = asStringList(row.limits);
  if (
    typeof row.id !== "string" ||
    typeof row.toolSlug !== "string" ||
    typeof row.displayName !== "string" ||
    typeof row.useCase !== "string" ||
    typeof row.body !== "string" ||
    !pros ||
    !limits ||
    !isDuration(row.durationBucket) ||
    typeof row.updatedAt !== "string"
  ) {
    return null;
  }
  return {
    id: row.id,
    toolSlug: row.toolSlug,
    displayName: row.displayName,
    useCase: row.useCase,
    body: row.body,
    pros,
    limits,
    durationBucket: row.durationBucket,
    switchedFromSlug: typeof row.switchedFromSlug === "string" ? row.switchedFromSlug : null,
    switchedFromLabel: typeof row.switchedFromLabel === "string" ? row.switchedFromLabel : null,
    publishedAt: typeof row.publishedAt === "string" ? row.publishedAt : null,
    updatedAt: row.updatedAt,
  };
}

export function parsePublicExperiencePage(value: unknown): {
  experiences: CommunityExperiencePublic[];
  nextCursor: string | null;
} | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!Array.isArray(row.experiences)) return null;
  const experiences: CommunityExperiencePublic[] = [];
  for (const item of row.experiences) {
    const parsed = parsePublicExperience(item);
    if (!parsed) return null;
    experiences.push(parsed);
  }
  return {
    experiences,
    nextCursor: typeof row.nextCursor === "string" && row.nextCursor.length > 0 ? row.nextCursor : null,
  };
}
