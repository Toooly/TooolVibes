import { z } from "@/lib/validation/zod";

export const SIGNAL_FOCUS_AREAS = [
  "product",
  "design",
  "engineering",
  "marketing",
  "operations",
  "research",
] as const;

export const SIGNAL_PRIMARY_GOALS = [
  "discover",
  "compare",
  "shortlist",
  "learn",
  "decide",
] as const;

export type SignalFocusArea = (typeof SIGNAL_FOCUS_AREAS)[number];
export type SignalPrimaryGoal = (typeof SIGNAL_PRIMARY_GOALS)[number];

export const signalProfileContextSchema = z
  .object({
    focusArea: z.enum(SIGNAL_FOCUS_AREAS),
    primaryGoal: z.enum(SIGNAL_PRIMARY_GOALS),
  })
  .strict();

export type SignalProfileContextInput = z.infer<typeof signalProfileContextSchema>;

export const FOCUS_AREA_LABELS: Record<SignalFocusArea, string> = {
  product: "Product",
  design: "Design",
  engineering: "Engineering",
  marketing: "Marketing",
  operations: "Operations",
  research: "Research",
};

export const PRIMARY_GOAL_LABELS: Record<SignalPrimaryGoal, string> = {
  discover: "Scoprire tool",
  compare: "Confrontare opzioni",
  shortlist: "Organizzare shortlist",
  learn: "Capire il panorama",
  decide: "Prendere una decisione",
};
