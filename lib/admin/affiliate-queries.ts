import "server-only";

import { cache } from "react";

import {
  getAllAffiliateLinksFromSupabase,
  getAffiliateLinksByToolId,
  getAffiliateLinkById,
  createAffiliateLinkInSupabase,
  updateAffiliateLinkInSupabase,
  deleteAffiliateLinkFromSupabase,
  type AffiliateLinkCreateInput,
  type AffiliateLinkUpdateInput,
} from "@/lib/supabase/affiliate-repository";
import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import type { AffiliateLinkRecord } from "@/lib/types/affiliate-link";

export type AffiliateRuntime = {
  links: (AffiliateLinkRecord & { tool_name?: string })[];
  canWrite: boolean;
  activeCount: number;
  inactiveCount: number;
};

export const getAffiliateRuntime = cache(async (): Promise<AffiliateRuntime> => {
  if (!isSupabaseAdminEnabled()) {
    return { links: [], canWrite: false, activeCount: 0, inactiveCount: 0 };
  }

  try {
    const links = await getAllAffiliateLinksFromSupabase();
    return {
      links,
      canWrite: true,
      activeCount: links.filter((l) => l.is_active).length,
      inactiveCount: links.filter((l) => !l.is_active).length,
    };
  } catch {
    return { links: [], canWrite: false, activeCount: 0, inactiveCount: 0 };
  }
});

export async function getAffiliateLinksForTool(toolId: string) {
  if (!isSupabaseAdminEnabled()) return [];
  return getAffiliateLinksByToolId(toolId);
}

export async function getAffiliateLink(id: string) {
  if (!isSupabaseAdminEnabled()) return null;
  return getAffiliateLinkById(id);
}

export async function createAffiliateLink(input: AffiliateLinkCreateInput) {
  return createAffiliateLinkInSupabase(input);
}

export async function updateAffiliateLink(id: string, input: AffiliateLinkUpdateInput) {
  return updateAffiliateLinkInSupabase(id, input);
}

export async function deleteAffiliateLink(id: string) {
  return deleteAffiliateLinkFromSupabase(id);
}
