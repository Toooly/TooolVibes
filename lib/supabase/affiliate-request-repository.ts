import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import type {
  AffiliateRequestRecord,
  AffiliateRequestStatus,
} from "@/lib/types/affiliate-request";

export const affiliateRequestSelect = `
  id,
  first_name,
  last_name,
  email,
  brand_name,
  website_url,
  audience,
  channels,
  message,
  status,
  admin_notes,
  referral_code,
  referral_url,
  approved_at,
  rejected_at,
  created_at,
  updated_at
`;

export type AffiliateRequestCreateInput = {
  first_name: string;
  last_name: string;
  email: string;
  brand_name?: string | null;
  website_url?: string | null;
  audience?: string | null;
  channels?: string | null;
  message?: string | null;
};

export type AffiliateRequestUpdateInput = Partial<
  Pick<
    AffiliateRequestRecord,
    | "status"
    | "admin_notes"
    | "referral_code"
    | "referral_url"
    | "approved_at"
    | "rejected_at"
  >
>;

export const getAdminAffiliateRequestsFromSupabase = cache(
  async (): Promise<AffiliateRequestRecord[]> => {
    const client = createAdminSupabaseClient();
    const { data, error } = await client
      .from("affiliate_requests")
      .select(affiliateRequestSelect)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Non è stato possibile caricare le richieste di affiliazione. Dettaglio: ${error.message}`);
    }

    return data ?? [];
  },
);

export async function getAffiliateRequestByIdFromSupabase(
  id: string,
): Promise<AffiliateRequestRecord | null> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("affiliate_requests")
    .select(affiliateRequestSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Non è stato possibile caricare questa richiesta di affiliazione. Dettaglio: ${error.message}`);
  }

  return data;
}

export async function getRecentRejectedAffiliateRequestByEmail(
  email: string,
  sinceIso: string,
): Promise<AffiliateRequestRecord | null> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("affiliate_requests")
    .select(affiliateRequestSelect)
    .eq("email", email.toLowerCase())
    .eq("status", "rejected" satisfies AffiliateRequestStatus)
    .gte("rejected_at", sinceIso)
    .order("rejected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Non è stato possibile verificare le richieste di affiliazione già respinte. Dettaglio: ${error.message}`);
  }

  return data;
}

export async function createAffiliateRequestInSupabase(
  input: AffiliateRequestCreateInput,
): Promise<AffiliateRequestRecord> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("affiliate_requests")
    .insert(input)
    .select(affiliateRequestSelect)
    .single();

  if (error) {
    throw new Error(`Non è stato possibile inviare la richiesta di affiliazione. Dettaglio: ${error.message}`);
  }

  return data;
}

export async function updateAffiliateRequestInSupabase(
  id: string,
  input: AffiliateRequestUpdateInput,
): Promise<AffiliateRequestRecord> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("affiliate_requests")
    .update(input)
    .eq("id", id)
    .select(affiliateRequestSelect)
    .single();

  if (error) {
    throw new Error(`Non è stato possibile aggiornare questa richiesta di affiliazione. Dettaglio: ${error.message}`);
  }

  return data;
}

export async function deleteAffiliateRequestFromSupabase(id: string): Promise<void> {
  const client = createAdminSupabaseClient();
  const { error } = await client.from("affiliate_requests").delete().eq("id", id);

  if (error) {
    throw new Error(`Non è stato possibile eliminare questa richiesta di affiliazione. Dettaglio: ${error.message}`);
  }
}
