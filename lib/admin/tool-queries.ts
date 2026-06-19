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
    "Il feed pubblico dei tool non è riuscito a leggere l'archivio principale ed è passato alla sorgente locale.",
  "supabase-admin-read-failed":
    "Il pannello tool non riesce a leggere l'archivio principale e resta sulla copia locale.",
  "supabase-admin-query-failed":
    "La lettura interna dei tool non è riuscita e l'area resta in modalità ridotta.",
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
        "Lettura interna su copia locale: l'archivio principale non è configurato in questo ambiente.",
      writeMessage:
        "Salvataggio tool non attivo: l'area resta sulla copia locale in sola lettura finché l'archivio principale non è configurato.",
    });
  }

  if (!(await canAccessSupabaseToolsAdmin())) {
    return buildSnapshotRuntime({
      publicSnapshot,
      requestedAdminReadSource: "supabase",
      readMessage:
        "Lettura interna ridotta su copia locale: connessione admin richiesta ma non accessibile in questo ambiente.",
      writeMessage:
        "L'archivio principale dei tool non è accessibile: l'area blocca i salvataggi e continua con una copia leggibile per non lasciare stati ambigui.",
      warnings: ["supabase-admin-read-failed"],
    });
  }

  try {
    return {
      tools: await getAdminToolsFromSupabase(),
      publicSnapshot,
      adminReadSource: "supabase",
      requestedAdminReadSource: "supabase",
      readMessage: "Lettura interna attiva con inventario tool completo.",
      canWrite: true,
      writeTarget: "supabase",
      writeMessage:
        "Salvataggio tool attivo. Dashboard, modifica e azioni rapide operano sull'archivio principale.",
      warnings: publicSnapshot.warnings,
    };
  } catch {
    return buildSnapshotRuntime({
      publicSnapshot,
      requestedAdminReadSource: "supabase",
      readMessage:
        "Lettura interna ridotta su copia locale: la query admin tool ha fallito dopo l'avvio della connessione.",
      writeMessage:
        "Area tool in modalità prudente: finché la lettura interna non torna stabile, i salvataggi restano bloccati e il pannello usa una copia coerente.",
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
