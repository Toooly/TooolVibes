import "server-only";

import { cache } from "react";

import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import {
  createAffiliateRequestInSupabase,
  deleteAffiliateRequestFromSupabase,
  getAdminAffiliateRequestsFromSupabase,
  getAffiliateRequestByIdFromSupabase,
  getRecentRejectedAffiliateRequestByEmail,
  updateAffiliateRequestInSupabase,
  type AffiliateRequestCreateInput,
  type AffiliateRequestUpdateInput,
} from "@/lib/supabase/affiliate-request-repository";
import type { AffiliateRequestRecord } from "@/lib/types/affiliate-request";

export type AffiliateRequestsRuntime = {
  requests: AffiliateRequestRecord[];
  canWrite: boolean;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  reviewingCount: number;
};

export const getAffiliateRequestsRuntime = cache(
  async (): Promise<AffiliateRequestsRuntime> => {
    if (!isSupabaseAdminEnabled()) {
      return {
        requests: [],
        canWrite: false,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        reviewingCount: 0,
      };
    }

    try {
      const requests = await getAdminAffiliateRequestsFromSupabase();
      return {
        requests,
        canWrite: true,
        pendingCount: requests.filter((request) => request.status === "received").length,
        reviewingCount: requests.filter((request) => request.status === "reviewing").length,
        approvedCount: requests.filter((request) => request.status === "approved").length,
        rejectedCount: requests.filter((request) => request.status === "rejected").length,
      };
    } catch {
      return {
        requests: [],
        canWrite: false,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        reviewingCount: 0,
      };
    }
  },
);

export async function getAffiliateRequest(id: string) {
  if (!isSupabaseAdminEnabled()) return null;
  return getAffiliateRequestByIdFromSupabase(id);
}

export async function getRejectedAffiliateRequestCooldown(email: string, sinceIso: string) {
  if (!isSupabaseAdminEnabled()) return null;
  return getRecentRejectedAffiliateRequestByEmail(email, sinceIso);
}

export async function createAffiliateRequest(input: AffiliateRequestCreateInput) {
  return createAffiliateRequestInSupabase(input);
}

export async function updateAffiliateRequest(
  id: string,
  input: AffiliateRequestUpdateInput,
) {
  return updateAffiliateRequestInSupabase(id, input);
}

export async function deleteAffiliateRequest(id: string) {
  return deleteAffiliateRequestFromSupabase(id);
}
