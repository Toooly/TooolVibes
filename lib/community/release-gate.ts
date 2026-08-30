import { isCommunityReadEnabled } from "@/lib/community/read-flag";
import { isCommunityReportFlagEnabled } from "@/lib/community/report-flag";
import { isCommunityWriteFlagEnabled } from "@/lib/community/write-flag";

export function isCommunityPublicReadReleased() {
  return isCommunityReadEnabled();
}

export function isCommunityOwnerGetReleased() {
  return (
    isCommunityReadEnabled() &&
    (isCommunityWriteFlagEnabled() || isCommunityReportFlagEnabled())
  );
}

export function isCommunityWriteReleased() {
  return isCommunityReadEnabled() && isCommunityWriteFlagEnabled();
}

export function isCommunityReportReleased() {
  return isCommunityReadEnabled() && isCommunityReportFlagEnabled();
}
