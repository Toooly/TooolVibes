import { fetchOwnerExperience } from "@/lib/community/client";
import type { CommunityExperienceOwner } from "@/lib/community/schema";

const inflight = new Map<string, Promise<CommunityExperienceOwner | null>>();

export function resetOwnExperienceCacheForTests() {
  inflight.clear();
}

export function loadOwnExperience(
  token: string,
  toolSlug: string,
): Promise<CommunityExperienceOwner | null> {
  const key = `${token}|${toolSlug}`;
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = fetchOwnerExperience({ token, toolSlug })
    .then((result) => {
      if (!result.ok) return null;
      return result.experience;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}
