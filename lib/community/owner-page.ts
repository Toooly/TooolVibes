import { parsePublicExperience } from "@/lib/community/public-page";
import {
  COMMUNITY_STATUSES,
  type CommunityExperienceOwner,
  type ExperienceStatus,
} from "@/lib/community/schema";

function isStatus(value: unknown): value is ExperienceStatus {
  return typeof value === "string" && (COMMUNITY_STATUSES as readonly string[]).includes(value);
}

export function parseOwnerExperience(value: unknown): CommunityExperienceOwner | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const base = parsePublicExperience(value);
  if (!base || !isStatus(row.status) || typeof row.createdAt !== "string" || typeof row.submittedAt !== "string") {
    return null;
  }
  return {
    ...base,
    status: row.status,
    createdAt: row.createdAt,
    submittedAt: row.submittedAt,
    moderatedAt: typeof row.moderatedAt === "string" ? row.moderatedAt : null,
    moderationReason: typeof row.moderationReason === "string" ? row.moderationReason : null,
  };
}

export const OWNER_STATUS_LABEL: Record<ExperienceStatus, string> = {
  pending: "In revisione",
  published: "Pubblicata",
  rejected: "Non pubblicata",
  hidden: "Nascosta",
};
