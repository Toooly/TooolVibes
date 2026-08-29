import "server-only";

import { revalidatePath } from "next/cache";

import { toolSlugSchema } from "@/lib/community/schema";

export function revalidateExperienceToolPage(toolSlug: string) {
  const parsed = toolSlugSchema.safeParse(toolSlug);
  if (!parsed.success) return;
  revalidatePath(`/toools/${parsed.data}`);
}
