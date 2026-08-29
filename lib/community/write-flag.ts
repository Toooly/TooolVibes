import { isCommunityReadEnabled } from "@/lib/community/read-flag";
import { releaseFeatures } from "@/lib/config/release-features";

export function isCommunityWriteFlagEnabled() {
  return releaseFeatures.communityWrite.enabled;
}

export function isCommunityWriteUiEnabled() {
  return isCommunityReadEnabled() && isCommunityWriteFlagEnabled();
}
