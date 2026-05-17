import "server-only";

import { cache } from "react";

import { getPublicToolsSnapshot, type PublicToolsSnapshot } from "@/lib/data/public-tools";
import { mockTools } from "@/lib/data/mock-tools";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";
import {
  canAccessSupabaseToolsAdmin,
  getAdminToolByIdFromSupabase,
  getAdminToolsFromSupabase,
} from "@/lib/supabase/tool-repository";
import type { ToolRecord } from "@/lib/types/tool";

export type AdminToolsRuntime = {
  tools: ToolRecord[];
  publicSnapshot: PublicToolsSnapshot;
  adminReadSource: "supabase" | "snapshot";
  requestedAdminReadSource: "supabase" | "snapshot";
  readMessage: string;
  canWrite: boolean;
  writeTarget: "supabase" | null;
  writeMessage: string;
  warnings: string[];
};

const adminToolWarningLabels: Record<string, string> = {
  "supabase-public-read-failed":
    "Il feed pubblico tools non è riuscito a leggere Supabase ed ? passato al fallback mock.",
  "supabase-admin-read-failed":
    "Il layer admin tools non riesce a leggere Supabase e resta in fallback snapshot.",
  "supabase-admin-query-failed":
    "La query admin tools ha fallito dopo il bootstrap della connessione e il workspace ? degradato.",
};

function sortTools(items: ToolRecord[]) {
  return [...items].sort((left, right) =>
    right.date_discovered.localeCompare(left.date_discovered),
  );
}

export function isSupabaseAdminEnabled() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return Boolean(url && serviceRoleKey);
}

export function getAdminToolWarningLabel(warning: string) {
  return adminToolWarningLabels[warning] ?? warning;
}

function buildSnapshotRuntime({
  publicSnapshot,
  requestedAdminReadSource,
  readMessage,
  writeMessage,
  warnings = [],
}: {
  publicSnapshot: PublicToolsSnapshot;
  requestedAdminReadSource: "supabase" | "snapshot";
  readMessage: string;
  writeMessage: string;
  warnings?: string[];
}): AdminToolsRuntime {
  return {
    tools: sortTools(mockTools),
    publicSnapshot,
    adminReadSource: "snapshot",
    requestedAdminReadSource,
    readMessage,
    canWrite: false,
    writeTarget: null,
    writeMessage,
    warnings: Array.from(new Set([...publicSnapshot.warnings, ...warnings])),
  };
}

export const isSupabaseToolsWriteEnabled = cache(async () => {
  if (!isSupabaseAdminEnabled()) {
    return false;
  }

  return canAccessSupabaseToolsAdmin();
});

export const getAdminToolsRuntime = cache(async (): Promise<AdminToolsRuntime> => {
  const publicSnapshot = await getPublicToolsSnapshot();

  if (!isSupabaseAdminEnabled()) {
    return buildSnapshotRuntime({
      publicSnapshot,
      requestedAdminReadSource: "snapshot",
      readMessage:
        "Lettura interna in snapshot mock: le env Supabase admin non sono presenti in questo ambiente.",
      writeMessage:
        "Scritture tools non attive: la surface founders resta su snapshot mock in sola lettura finché Supabase admin non è configurato.",
    });
  }

  if (!(await canAccessSupabaseToolsAdmin())) {
    return buildSnapshotRuntime({
      publicSnapshot,
      requestedAdminReadSource: "supabase",
      readMessage:
        "Lettura interna degradata su snapshot mock: connessione admin richiesta ma non accessibile in questo ambiente.",
      writeMessage:
        "Supabase admin tools non accessibile: il workspace founders blocca le mutazioni e continua in fallback leggibile per non lasciare stati ambigui.",
      warnings: ["supabase-admin-read-failed"],
    });
  }

  try {
    return {
      tools: await getAdminToolsFromSupabase(),
      publicSnapshot,
      adminReadSource: "supabase",
      requestedAdminReadSource: "supabase",
      readMessage: "Lettura interna live da Supabase con inventario tools completo.",
      canWrite: true,
      writeTarget: "supabase",
      writeMessage:
        "Scritture tools attive su Supabase. Dashboard, edit e quick actions operano sul repository persistente.",
      warnings: publicSnapshot.warnings,
    };
  } catch {
    return buildSnapshotRuntime({
      publicSnapshot,
      requestedAdminReadSource: "supabase",
      readMessage:
        "Lettura interna degradata su snapshot mock: la query admin tools ha fallito dopo il bootstrap della connessione.",
      writeMessage:
        "Runtime tools in modalita` prudente: fino a quando la lettura admin non torna stabile, le mutazioni restano bloccate e il pannello usa un fallback consistente.",
      warnings: ["supabase-admin-query-failed"],
    });
  }
});

export async function getAdminTools() {
  const runtime = await getAdminToolsRuntime();
  return runtime.tools;
}

export async function getAdminToolById(id: string) {
  const runtime = await getAdminToolsRuntime();
  const toolFromRuntime = runtime.tools.find((tool) => tool.id === id) ?? null;

  if (toolFromRuntime || !runtime.canWrite) {
    return toolFromRuntime;
  }

  return getAdminToolByIdFromSupabase(id);
}
