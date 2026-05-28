export type ToolRequestStatus = "received" | "reviewing" | "approved" | "rejected";

export type ToolRequestRecord = {
  id: string;
  tool_name: string;
  tool_url: string;
  category: string;
  level: string;
  email: string | null;
  message: string | null;
  status: ToolRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
};
