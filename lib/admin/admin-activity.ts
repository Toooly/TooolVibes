import activityJson from "@/data/admin-activity.json";

export type AdminActivityEvent = {
  at: string;
  action: string;
  entity: string;
  id?: string;
};

export function getAdminActivity(limit = 12): AdminActivityEvent[] {
  const events = (activityJson as { events?: AdminActivityEvent[] }).events ?? [];
  return events.slice(0, limit);
}
