export type AffiliateRequestStatus = "received" | "reviewing" | "approved" | "rejected";

export type AffiliateRequestRecord = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  brand_name: string | null;
  website_url: string | null;
  audience: string | null;
  channels: string | null;
  message: string | null;
  status: AffiliateRequestStatus;
  admin_notes: string | null;
  referral_code: string | null;
  referral_url: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string | null;
};
