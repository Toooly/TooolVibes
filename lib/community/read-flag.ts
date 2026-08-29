import { releaseFeatures } from "@/lib/config/release-features";

export function isCommunityReadEnabled() {
  return releaseFeatures.communityRead.enabled;
}
