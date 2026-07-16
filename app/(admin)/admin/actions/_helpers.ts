import { revalidatePath } from "next/cache";

import type { ArticleFormState } from "@/lib/admin/article-form";
import type { CollectionFormState } from "@/lib/admin/collection-form";
import type { ToolFormState } from "@/lib/admin/tool-form";

export type ToolRevalidationTarget = {
  path: string;
  type?: "layout" | "page";
};

const toolSharedRevalidationTargets: readonly ToolRevalidationTarget[] = [
  { path: "/", type: "layout" },
  { path: "/archivio" },
  { path: "/tags" },
  { path: "/shortlist" },
  { path: "/compare" },
  { path: "/api/tools" },
  { path: "/sitemap.xml" },
  { path: "/toools/[slug]", type: "page" },
  { path: "/admin" },
  { path: "/admin/tools" },
];

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function getToolRevalidationTargets(
  slug: string,
  previousSlug?: string,
): ToolRevalidationTarget[] {
  const targets: ToolRevalidationTarget[] = [
    ...toolSharedRevalidationTargets,
    { path: `/toools/${slug}` },
  ];

  if (previousSlug && previousSlug !== slug) {
    targets.push({ path: `/toools/${previousSlug}` });
  }

  return targets;
}

export function revalidateToolPaths(slug: string, previousSlug?: string) {
  for (const target of getToolRevalidationTargets(slug, previousSlug)) {
    revalidatePath(target.path, target.type);
  }
}

export function revalidateArticlePaths(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/posts/${slug}`);

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/posts/${previousSlug}`);
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
      "Il salvataggio dei tool non è ancora attivo. Controlla la configurazione dell'area admin prima di riprovare.",
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
    message: "Non è stato possibile completare il salvataggio. Riprova.",
    values,
  };
}

export function getCollectionSupabaseDisabledState(): CollectionFormState {
  return {
    status: "error",
    message:
      "Il salvataggio delle raccolte non è ancora attivo. Completa la configurazione dell'area admin prima di riprovare.",
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
      message: "Esiste già una raccolta con questo slug. Scegline uno diverso.",
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
        "Non è stato possibile aggiornare i tool inclusi. Controlla tool e ordine, poi riprova.",
      values,
    };
  }

  return {
    status: "error",
    message: "Non è stato possibile completare il salvataggio della raccolta.",
    values,
  };
}

export function getArticleSupabaseDisabledState(): ArticleFormState {
  return {
    status: "error",
    message:
      "Il salvataggio del blog non è ancora attivo. Completa la configurazione dell'area admin prima di riprovare.",
  };
}

export function getArticleMutationErrorState(
  error: unknown,
  values?: ArticleFormState["values"],
): ArticleFormState {
  const message =
    error instanceof Error ? error.message : "Errore inatteso durante il salvataggio.";

  if (message.includes("duplicate key value") || message.includes("editorial_articles_slug_key")) {
    return {
      status: "error",
      message: "Esiste già un articolo con questo slug. Scegline uno diverso.",
      fieldErrors: {
        slug: "Questo slug è già in uso.",
      },
      values,
    };
  }

  return {
    status: "error",
    message: "Non è stato possibile completare il salvataggio dell'articolo.",
    values,
  };
}
