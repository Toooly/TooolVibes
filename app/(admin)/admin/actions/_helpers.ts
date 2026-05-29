import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { CollectionFormState } from "@/lib/admin/collection-form";
import type { ToolFormState } from "@/lib/admin/tool-form";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function isLoginRateLimited(): Promise<boolean> {
  const key = await getLoginAttemptKey();
  const attempt = loginAttempts.get(key);
  const now = Date.now();

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.delete(key);
    return false;
  }

  return attempt.count >= MAX_LOGIN_ATTEMPTS;
}

async function getLoginAttemptKey() {
  const headersList = await headers();
  return (
    headersList.get("cf-connecting-ip") ??
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function recordFailedLoginAttempt(): Promise<void> {
  const key = await getLoginAttemptKey();
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  attempt.count++;
}

export async function clearLoginAttempts(): Promise<void> {
  const key = await getLoginAttemptKey();
  loginAttempts.delete(key);
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function revalidateToolPaths(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/archivio");
  revalidatePath("/tags");
  revalidatePath("/admin");
  revalidatePath("/api/tools");
  revalidatePath(`/toools/${slug}`);

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/toools/${previousSlug}`);
  }
}

export function revalidateCollectionPaths(
  slug: string,
  toolSlugs: string[],
  previous?: { slug?: string; toolSlugs?: string[] },
) {
  revalidatePath("/");
  revalidatePath("/archivio");
  revalidatePath("/collections");
  revalidatePath("/admin/collections");
  revalidatePath("/admin/collections/review");
  revalidatePath(`/collections/${slug}`);
  revalidatePath(`/admin/collections/review/${slug}`);

  for (const toolSlug of toolSlugs) {
    revalidatePath(`/toools/${toolSlug}`);
  }

  if (previous?.slug && previous.slug !== slug) {
    revalidatePath(`/collections/${previous.slug}`);
  }

  for (const toolSlug of previous?.toolSlugs ?? []) {
    if (!toolSlugs.includes(toolSlug)) {
      revalidatePath(`/toools/${toolSlug}`);
    }
  }
}

export function appendStatusParams(
  path: string,
  values: Record<string, string | null | undefined>,
) {
  const url = new URL(path, "http://localhost");

  for (const [key, value] of Object.entries(values)) {
    if (value && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function getSupabaseDisabledState(): ToolFormState {
  return {
    status: "error",
    message:
      "Verifica `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e l'accesso reale alla tabella `tools` prima di riattivare le scritture founders.",
  };
}

export function getMutationErrorState(
  error: unknown,
  values?: ToolFormState["values"],
): ToolFormState {
  const message = error instanceof Error ? error.message : "Errore inatteso durante il salvataggio.";

  if (message.includes("duplicate key value") || message.includes("tools_slug_key")) {
    return {
      status: "error",
      message: "Esiste già un tool con questo slug. Scegline uno diverso.",
      fieldErrors: {
        slug: "Questo slug è già in uso.",
      },
      values,
    };
  }

  return {
    status: "error",
    message: "Non è stato possibile completare l'operazione su Supabase. Riprova.",
    values,
  };
}

export function getCollectionSupabaseDisabledState(): CollectionFormState {
  return {
    status: "error",
    message:
      "Configura Supabase admin e applica le migration collections per abilitare le scritture editoriali reali.",
  };
}

export function getCollectionMutationErrorState(
  error: unknown,
  values: CollectionFormState["values"],
): CollectionFormState {
  const message =
    error instanceof Error ? error.message : "Errore inatteso durante il salvataggio.";

  if (message.includes("duplicate key value") || message.includes("collections_slug_key")) {
    return {
      status: "error",
      message: "Esiste già una collection con questo slug. Scegline uno diverso.",
      fieldErrors: {
        slug: "Questo slug è già in uso.",
      },
      values,
    };
  }

  if (message.includes("collection_tool_slots")) {
    return {
      status: "error",
      message:
        "Non è stato possibile aggiornare i tool inclusi. Controlla tool, ordine e migration collections.",
      values,
    };
  }

  return {
    status: "error",
    message: "Non è stato possibile completare il salvataggio della collection.",
    values,
  };
}
