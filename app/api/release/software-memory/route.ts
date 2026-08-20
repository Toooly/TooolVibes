import { NextResponse } from "next/server";
import { releaseFeatures } from "@/lib/config/release-features";
import { canReadSignalProgressionUi, canWriteSignalEvents } from "@/lib/signal-progression/flags";
import { createAdminSupabaseClient, isSupabaseAdminEnabled } from "@/lib/supabase/admin-client";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";
import { SOFTWARE_MEMORY_VALIDATOR_SQL } from "@/lib/release/software-memory-sql";

export const dynamic = "force-dynamic";

const CONFIRM = "workspace_state_v1_software_memory";

function payloads() {
  const legacy = {
    schemaVersion: 1 as const,
    clearedAt: null,
    saved: { slugs: ["cursor"], updatedAt: "2026-08-20T10:00:00.000Z" },
    compare: { slugs: [] as string[], updatedAt: null },
    stack: { slugs: [] as string[], updatedAt: null },
    toolStates: {
      cursor: {
        stage: "saved" as const,
        note: null,
        saveReason: null,
        pinned: false,
        decision: { outcome: "selected" as const, updatedAt: "2026-08-20T10:00:00.000Z" },
        updatedAt: "2026-08-20T10:00:00.000Z",
      },
    },
  };
  const journal = {
    ...legacy,
    personalStacks: [] as const,
    toolStates: {
      cursor: {
        ...legacy.toolStates.cursor,
        useCase: null,
        alternatives: [] as string[],
        revisitAt: null,
      },
    },
  };
  const using = {
    ...journal,
    toolStates: {
      cursor: {
        ...journal.toolStates.cursor,
        usage: "using",
        replacedBy: null,
        compareObjective: "save-time",
      },
    },
  };
  const stopped = {
    ...journal,
    toolStates: {
      cursor: {
        ...journal.toolStates.cursor,
        usage: "stopped",
        replacedBy: null,
        compareObjective: null,
      },
    },
  };
  const replaced = {
    ...journal,
    toolStates: {
      cursor: {
        ...journal.toolStates.cursor,
        usage: "replaced",
        replacedBy: "v0",
        compareObjective: null,
      },
    },
  };
  return { legacy, journal, using, stopped, replaced };
}

async function probe() {
  const admin = createAdminSupabaseClient();
  const out: Record<string, { valid: boolean | null; error: string | null }> = {};
  for (const [name, input] of Object.entries(payloads())) {
    const { data, error } = await admin.rpc("workspace_state_v1_is_valid", { input });
    out[name] = {
      valid: typeof data === "boolean" ? data : null,
      error: error?.message ?? null,
    };
  }
  return out;
}

export async function GET() {
  const config = releaseFeatures;
  const signal = {
    ui: canReadSignalProgressionUi(config),
    writes: canWriteSignalEvents(config),
  };
  if (!isSupabaseAdminEnabled()) {
    return NextResponse.json({ signal, admin: false, probe: null });
  }
  const results = await probe();
  return NextResponse.json({ signal, admin: true, probe: results });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || body.confirm !== CONFIRM) {
    return NextResponse.json({ error: "confirm_required" }, { status: 400 });
  }
  if (!isSupabaseAdminEnabled()) {
    return NextResponse.json({ error: "admin_disabled" }, { status: 503 });
  }

  const before = await probe();
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  const attempts = [];
  const ref = new URL(url ?? "").hostname.split(".")[0];
  const headers = {
    apikey: serviceRoleKey ?? "",
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  for (const attempt of [
    {
      transport: "pg-meta",
      href: `${url}/pg-meta/default/query`,
      body: { query: SOFTWARE_MEMORY_VALIDATOR_SQL },
    },
    {
      transport: "management-query",
      href: `https://api.supabase.com/v1/projects/${ref}/database/query`,
      body: { query: SOFTWARE_MEMORY_VALIDATOR_SQL },
    },
    {
      transport: "management-migration",
      href: `https://api.supabase.com/v1/projects/${ref}/database/migrations`,
      body: {
        name: "workspace_state_v1_software_memory",
        query: SOFTWARE_MEMORY_VALIDATOR_SQL,
      },
    },
  ]) {
    const response = await fetch(attempt.href, {
      method: "POST",
      headers,
      body: JSON.stringify(attempt.body),
    });
    const text = await response.text();
    attempts.push({
      transport: attempt.transport,
      status: response.status,
      ok: response.ok,
      body: text.slice(0, 240),
    });
    if (response.ok) break;
  }

  const after = await probe();
  return NextResponse.json({ before, apply: attempts, after });
}
