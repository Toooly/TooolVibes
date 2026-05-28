export type AffiliateLinkRecord = {
  id: string;
  tool_id: string;
  label: string;
  destination_url: string;
  tracking_url: string | null;
  campaign: string | null;
  source: string | null;
  medium: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
