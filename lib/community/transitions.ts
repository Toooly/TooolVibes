import type { ExperienceStatus } from "@/lib/community/schema";

export type OwnerEditPatch = {
  status: "pending";
  published_at: null;
  moderated_at: null;
  moderation_reason: null;
  submitted_at: string;
};

export function ownerEditResubmits(status: ExperienceStatus): boolean {
  return status === "published" || status === "rejected" || status === "hidden" || status === "pending";
}

export function ownerEditPatch(nowIso: string): OwnerEditPatch {
  return {
    status: "pending",
    published_at: null,
    moderated_at: null,
    moderation_reason: null,
    submitted_at: nowIso,
  };
}
