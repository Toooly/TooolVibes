export type ToolRequestStatus = "received" | "reviewing" | "approved" | "rejected";
export type ToolRequestSubmitterType = "community" | "founder";

export type ToolRequestRecord = {
  id: string;
  submitter_type: ToolRequestSubmitterType;
  tool_name: string;
  tool_url: string;
  category: string;
  level: string;
  email: string | null;
  message: string | null;
  use_case: string | null;
  referral_url: string | null;
  media_url: string | null;
  personal_notes: string | null;
  founder_name: string | null;
  company_role: string | null;
  launch_stage: string | null;
  budget_range: string | null;
  requested_services: string[] | null;
  status: ToolRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
};
