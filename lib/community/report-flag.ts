import { isCommunityReadEnabled } from "@/lib/community/read-flag";
import { releaseFeatures } from "@/lib/config/release-features";

export function isCommunityReportFlagEnabled() {
  return releaseFeatures.communityReport.enabled;
}

export function isCommunityReportUiEnabled() {
  return isCommunityReadEnabled() && isCommunityReportFlagEnabled();
}
