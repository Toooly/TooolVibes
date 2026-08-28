import { toggleWorkspaceCompare } from "@/lib/account/workspace-actions";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";

/** Queue stack members into compare without replacing an already-full tray. */
export function queueStackCompare(
  memberSlugs: readonly string[],
  compareSlugs: readonly string[],
) {
  const room = Math.max(0, MAX_COMPARE_TOOLS - compareSlugs.length);
  if (room === 0) return;
  const toAdd: string[] = [];
  for (const slug of memberSlugs) {
    if (toAdd.length >= room) break;
    if (compareSlugs.includes(slug)) continue;
    toAdd.push(slug);
  }
  for (const slug of toAdd) toggleWorkspaceCompare(slug);
}
