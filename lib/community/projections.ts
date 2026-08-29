import type {
  CommunityExperienceAdmin,
  CommunityExperienceOwner,
  CommunityExperiencePublic,
  DurationBucket,
  ExperienceStatus,
} from "@/lib/community/schema";

type PublicRow = {
  id: string;
  tool_slug: string;
  display_name: string;
  use_case: string;
  body: string;
  pros: string[];
  limits: string[];
  duration_bucket: DurationBucket;
  switched_from_slug: string | null;
  switched_from_label: string | null;
  published_at: string | null;
  updated_at: string;
};

type OwnerRow = PublicRow & {
  status: ExperienceStatus;
  created_at: string;
  submitted_at: string;
  moderated_at: string | null;
  moderation_reason: string | null;
};

type AdminRow = OwnerRow & {
  moderated_by: string | null;
};

export function toPublicExperience(row: PublicRow): CommunityExperiencePublic {
  return {
    id: row.id,
    toolSlug: row.tool_slug,
    displayName: row.display_name,
    useCase: row.use_case,
    body: row.body,
    pros: row.pros,
    limits: row.limits,
    durationBucket: row.duration_bucket,
    switchedFromSlug: row.switched_from_slug,
    switchedFromLabel: row.switched_from_label,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export function toOwnerExperience(row: OwnerRow): CommunityExperienceOwner {
  return {
    ...toPublicExperience(row),
    status: row.status,
    createdAt: row.created_at,
    submittedAt: row.submitted_at,
    moderatedAt: row.moderated_at,
    moderationReason: row.moderation_reason,
  };
}

export function toAdminExperience(row: AdminRow): CommunityExperienceAdmin {
  return {
    ...toOwnerExperience(row),
    moderatedBy: row.moderated_by,
  };
}
