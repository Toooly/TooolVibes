import type { DurationBucket } from "@/lib/community/schema";

export const DURATION_BUCKET_LABELS: Record<DurationBucket, string> = {
  under_1_month: "Meno di 1 mese",
  months_1_3: "1–3 mesi",
  months_3_6: "3–6 mesi",
  months_6_12: "6–12 mesi",
  year_plus: "Più di 1 anno",
};

export function durationBucketLabel(bucket: DurationBucket) {
  return DURATION_BUCKET_LABELS[bucket];
}
