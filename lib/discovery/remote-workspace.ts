import "server-only";

import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import type { SaveReason, ShortlistStage } from "@/lib/types/tool";
import type {
  DiscoveryWorkspaceState,
  ToolUserState,
  ViewerKind,
} from "@/lib/discovery/types";
import {
  mergeDiscoveryWorkspaceStates,
  normalizeDiscoveryWorkspaceState,
} from "@/lib/discovery/workspace-state";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";

export const discoveryViewerCookieName = "tooolvibes-viewer";

type ViewerProfileRow = {
  id: string;
  access_token: string;
  kind: ViewerKind;
  auth_user_id?: string | null;
};

type ViewerWorkspaceRow = {
  compare_slugs: string[] | null;
  compare_updated_at: string | null;
};

type ViewerToolStateRow = {
  tool_slug: string;
  is_saved: boolean;
  shortlist_stage: ShortlistStage;
  note: string | null;
  save_reason: SaveReason | null;
  is_pinned: boolean;
  updated_at: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function getRemoteDisabledState() {
  return {
    remoteAvailable: false,
    state: normalizeDiscoveryWorkspaceState({
      tool_states: {},
      compare: { slugs: [], updated_at: null },
    }),
  };
}

function isWorkspaceSchemaUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("viewer_profiles") ||
    message.includes("viewer_workspaces") ||
    message.includes("viewer_tool_states")
  );
}

export function isDiscoveryRemoteEnabled() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return Boolean(url && serviceRoleKey);
}

async function setViewerCookie(accessToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(discoveryViewerCookieName, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

async function getOrCreateViewerProfile() {
  if (!isDiscoveryRemoteEnabled()) {
    return null;
  }

  const client = createAdminSupabaseClient();
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(discoveryViewerCookieName)?.value;

  if (existingToken) {
    const { data, error } = await client
      .from("viewer_profiles")
      .select("id, access_token, kind, auth_user_id")
      .eq("access_token", existingToken)
      .maybeSingle();
    const viewer = (data ?? null) as ViewerProfileRow | null;

    if (error) {
      throw new Error(`Non è stato possibile caricare il profilo di navigazione. Dettaglio: ${error.message}`);
    }

    if (viewer) {
      await client
        .from("viewer_profiles")
        .update({ last_seen_at: nowIso() })
        .eq("id", viewer.id);

      return viewer;
    }
  }

  const accessToken = randomUUID();
  const { data, error } = await client
    .from("viewer_profiles")
    .insert({
      access_token: accessToken,
      kind: "guest",
      last_seen_at: nowIso(),
    })
    .select("id, access_token, kind, auth_user_id")
    .single();
  const createdViewer = (data ?? null) as ViewerProfileRow | null;

  if (error || !createdViewer) {
    throw new Error(`Non è stato possibile creare il profilo di navigazione. Dettaglio: ${error?.message ?? "Errore sconosciuto"}`);
  }

  await setViewerCookie(accessToken);
  return createdViewer;
}

async function getViewerProfileFromCookie() {
  if (!isDiscoveryRemoteEnabled()) {
    return null;
  }

  const client = createAdminSupabaseClient();
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(discoveryViewerCookieName)?.value;

  if (!existingToken) {
    return null;
  }

  const { data, error } = await client
    .from("viewer_profiles")
    .select("id, access_token, kind, auth_user_id")
    .eq("access_token", existingToken)
    .maybeSingle();
  const viewer = (data ?? null) as ViewerProfileRow | null;

  if (error) {
    throw new Error(`Non è stato possibile caricare il profilo di navigazione. Dettaglio: ${error.message}`);
  }

  if (viewer) {
    await client
      .from("viewer_profiles")
      .update({ last_seen_at: nowIso() })
      .eq("id", viewer.id);
  }

  return viewer;
}

async function getAuthenticatedUserId(authAccessToken: string) {
  const client = createAdminSupabaseClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser(authAccessToken);

  if (error || !user) {
    throw new Error(`Non è stato possibile riconoscere l'utente autenticato. Dettaglio: ${error?.message ?? "Errore sconosciuto"}`);
  }

  return user.id;
}

async function getViewerProfileByAuthUserId(authUserId: string) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("viewer_profiles")
    .select("id, access_token, kind, auth_user_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  const viewer = (data ?? null) as ViewerProfileRow | null;

  if (error) {
    throw new Error(`Non è stato possibile caricare il profilo collegato all'account. Dettaglio: ${error.message}`);
  }

  return viewer;
}

async function createGuestViewerProfile() {
  const client = createAdminSupabaseClient();
  const accessToken = randomUUID();
  const { data, error } = await client
    .from("viewer_profiles")
    .insert({
      access_token: accessToken,
      kind: "guest",
      last_seen_at: nowIso(),
    })
    .select("id, access_token, kind, auth_user_id")
    .single();
  const viewer = (data ?? null) as ViewerProfileRow | null;

  if (error || !viewer) {
    throw new Error(`Non è stato possibile creare il profilo ospite. Dettaglio: ${error?.message ?? "Errore sconosciuto"}`);
  }

  return viewer;
}

async function assignViewerToAuthUser(viewerId: string, authUserId: string) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("viewer_profiles")
    .update({
      kind: "account",
      auth_user_id: authUserId,
      last_seen_at: nowIso(),
    })
    .eq("id", viewerId)
    .select("id, access_token, kind, auth_user_id")
    .single();
  const viewer = (data ?? null) as ViewerProfileRow | null;

  if (error || !viewer) {
    throw new Error(`Non è stato possibile collegare il profilo al tuo account. Dettaglio: ${error?.message ?? "Errore sconosciuto"}`);
  }

  return viewer;
}

async function persistWorkspaceStateForViewer(
  viewerId: string,
  workspaceState: DiscoveryWorkspaceState,
) {
  const normalized = normalizeDiscoveryWorkspaceState(workspaceState);
  const client = createAdminSupabaseClient();
  const incomingToolSlugs = Object.keys(normalized.tool_states);

  const { error: workspaceError } = await client.from("viewer_workspaces").upsert(
    {
      viewer_id: viewerId,
      compare_slugs: normalized.compare.slugs,
      compare_updated_at: normalized.compare.updated_at ?? nowIso(),
    },
    { onConflict: "viewer_id" },
  );

  if (workspaceError) {
    throw new Error(`Non è stato possibile salvare il confronto. Dettaglio: ${workspaceError.message}`);
  }

  const { data: existingRows, error: existingRowsError } = await client
    .from("viewer_tool_states")
    .select("tool_slug")
    .eq("viewer_id", viewerId)
    .returns<Array<Pick<ViewerToolStateRow, "tool_slug">>>();

  if (existingRowsError) {
    throw new Error(`Non è stato possibile controllare i tool già salvati. Dettaglio: ${existingRowsError.message}`);
  }

  if (incomingToolSlugs.length > 0) {
    const { error: upsertError } = await client.from("viewer_tool_states").upsert(
      incomingToolSlugs.map((slug) => {
        const state = normalized.tool_states[slug];

        return {
          viewer_id: viewerId,
          tool_slug: slug,
          is_saved: state.is_saved,
          shortlist_stage: state.shortlist_stage,
          note: state.note ?? null,
          save_reason: state.save_reason ?? null,
          is_pinned: Boolean(state.is_pinned),
          updated_at: state.updated_at ?? nowIso(),
        };
      }),
      { onConflict: "viewer_id,tool_slug" },
    );

    if (upsertError) {
      throw new Error(`Non è stato possibile salvare le preferenze sui tool. Dettaglio: ${upsertError.message}`);
    }
  }

  const staleSlugs = (existingRows ?? [])
    .map((row) => row.tool_slug)
    .filter((slug) => !incomingToolSlugs.includes(slug));

  if (staleSlugs.length > 0) {
    const { error: deleteError } = await client
      .from("viewer_tool_states")
      .delete()
      .eq("viewer_id", viewerId)
      .in("tool_slug", staleSlugs);

    if (deleteError) {
      throw new Error(`Non è stato possibile aggiornare i tool rimossi dai salvati. Dettaglio: ${deleteError.message}`);
    }
  }

  if (incomingToolSlugs.length === 0) {
    const { error: clearError } = await client
      .from("viewer_tool_states")
      .delete()
      .eq("viewer_id", viewerId);

    if (clearError) {
      throw new Error(`Non è stato possibile svuotare i tool salvati. Dettaglio: ${clearError.message}`);
    }
  }
}

async function loadWorkspaceStateForViewer(viewerId: string): Promise<DiscoveryWorkspaceState> {
  const client = createAdminSupabaseClient();
  const [{ data: workspaceRow, error: workspaceError }, { data: toolRows, error: toolRowsError }] =
    await Promise.all([
      client
        .from("viewer_workspaces")
        .select("compare_slugs, compare_updated_at")
        .eq("viewer_id", viewerId)
        .maybeSingle(),
      client
        .from("viewer_tool_states")
        .select("tool_slug, is_saved, shortlist_stage, note, save_reason, is_pinned, updated_at")
        .eq("viewer_id", viewerId)
        .returns<ViewerToolStateRow[]>(),
    ]);
  const workspace = (workspaceRow ?? null) as ViewerWorkspaceRow | null;
  const rows = (toolRows ?? []) as ViewerToolStateRow[];

  if (workspaceError) {
    throw new Error(`Non è stato possibile caricare il confronto salvato. Dettaglio: ${workspaceError.message}`);
  }

  if (toolRowsError) {
    throw new Error(`Non è stato possibile caricare i tool salvati. Dettaglio: ${toolRowsError.message}`);
  }

  const toolStates = Object.fromEntries(
    rows.map((row) => [
      row.tool_slug,
      {
        is_saved: row.is_saved,
        shortlist_stage: row.shortlist_stage,
        note: row.note ?? undefined,
        save_reason: row.save_reason ?? undefined,
        is_pinned: row.is_pinned,
        updated_at: row.updated_at ?? undefined,
      } satisfies ToolUserState,
    ]),
  );

  return normalizeDiscoveryWorkspaceState({
    tool_states: toolStates,
    compare: {
      slugs: workspace?.compare_slugs ?? [],
      updated_at: workspace?.compare_updated_at ?? null,
    },
  });
}

export async function loadRemoteDiscoveryWorkspace() {
  if (!isDiscoveryRemoteEnabled()) {
    return getRemoteDisabledState();
  }

  try {
    const viewer = await getOrCreateViewerProfile();

    if (!viewer) {
      return getRemoteDisabledState();
    }

    const state = await loadWorkspaceStateForViewer(viewer.id);

    return {
      remoteAvailable: true,
      viewerKind: viewer.kind,
      state,
    };
  } catch (error) {
    if (isWorkspaceSchemaUnavailableError(error)) {
      return getRemoteDisabledState();
    }

    throw error;
  }
}

export async function saveRemoteDiscoveryWorkspace(
  workspaceState: DiscoveryWorkspaceState,
  authAccessToken: string,
) {
  if (!isDiscoveryRemoteEnabled()) {
    return getRemoteDisabledState();
  }

  try {
    const authUserId = await getAuthenticatedUserId(authAccessToken);
    let viewer = await getViewerProfileByAuthUserId(authUserId);

    if (!viewer) {
      const currentViewer = await getViewerProfileFromCookie();
      viewer =
        currentViewer?.kind === "guest"
          ? await assignViewerToAuthUser(currentViewer.id, authUserId)
          : await assignViewerToAuthUser((await createGuestViewerProfile()).id, authUserId);
    }

    const normalized = normalizeDiscoveryWorkspaceState(workspaceState);
    await persistWorkspaceStateForViewer(viewer.id, normalized);
    await setViewerCookie(viewer.access_token);

    return {
      remoteAvailable: true,
      viewerKind: "account" as const,
      state: await loadWorkspaceStateForViewer(viewer.id),
    };
  } catch (error) {
    if (isWorkspaceSchemaUnavailableError(error)) {
      return getRemoteDisabledState();
    }

    throw error;
  }
}

export async function attachAuthenticatedViewer(
  authAccessToken: string,
  localWorkspaceState?: DiscoveryWorkspaceState,
) {
  if (!isDiscoveryRemoteEnabled()) {
    return getRemoteDisabledState();
  }

  try {
    const client = createAdminSupabaseClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser(authAccessToken);

    if (error || !user) {
      throw new Error(`Non è stato possibile riconoscere l'utente autenticato. Dettaglio: ${error?.message ?? "Errore sconosciuto"}`);
    }

    const currentViewer = await getOrCreateViewerProfile();

    if (!currentViewer) {
      return getRemoteDisabledState();
    }

    const existingAccountViewer = await getViewerProfileByAuthUserId(user.id);
    const localState = normalizeDiscoveryWorkspaceState(localWorkspaceState);

    if (existingAccountViewer) {
      if (existingAccountViewer.id !== currentViewer.id && currentViewer.kind === "guest") {
        const guestState = await loadWorkspaceStateForViewer(currentViewer.id);
        const accountState = await loadWorkspaceStateForViewer(existingAccountViewer.id);
        const merged = mergeDiscoveryWorkspaceStates(
          localState,
          mergeDiscoveryWorkspaceStates(guestState, accountState),
        );
        await persistWorkspaceStateForViewer(existingAccountViewer.id, merged);
      } else {
        const accountState = await loadWorkspaceStateForViewer(existingAccountViewer.id);
        const merged = mergeDiscoveryWorkspaceStates(localState, accountState);
        await persistWorkspaceStateForViewer(existingAccountViewer.id, merged);
      }

      await setViewerCookie(existingAccountViewer.access_token);

      return {
        remoteAvailable: true,
        viewerKind: "account" as const,
        state: await loadWorkspaceStateForViewer(existingAccountViewer.id),
      };
    }

    const attachedViewer =
      currentViewer.kind === "guest"
        ? await assignViewerToAuthUser(currentViewer.id, user.id)
        : currentViewer.auth_user_id === user.id
          ? currentViewer
          : await assignViewerToAuthUser((await createGuestViewerProfile()).id, user.id);

    const attachedViewerState = await loadWorkspaceStateForViewer(attachedViewer.id);
    const mergedAttachedState = mergeDiscoveryWorkspaceStates(localState, attachedViewerState);
    await persistWorkspaceStateForViewer(attachedViewer.id, mergedAttachedState);

    await setViewerCookie(attachedViewer.access_token);

    return {
      remoteAvailable: true,
      viewerKind: "account" as const,
      state: await loadWorkspaceStateForViewer(attachedViewer.id),
    };
  } catch (error) {
    if (isWorkspaceSchemaUnavailableError(error)) {
      return getRemoteDisabledState();
    }

    throw error;
  }
}

export async function releaseAuthenticatedViewer(
  authAccessToken: string,
  localWorkspaceState?: DiscoveryWorkspaceState,
) {
  if (!isDiscoveryRemoteEnabled()) {
    return getRemoteDisabledState();
  }

  try {
    const authUserId = await getAuthenticatedUserId(authAccessToken);
    const currentViewer = await getViewerProfileFromCookie();

    if (!currentViewer) {
      return getRemoteDisabledState();
    }

    if (currentViewer.kind !== "account" || currentViewer.auth_user_id !== authUserId) {
      throw new Error("Il profilo di navigazione non appartiene all'utente autenticato.");
    }

    const currentState = mergeDiscoveryWorkspaceStates(
      normalizeDiscoveryWorkspaceState(localWorkspaceState),
      await loadWorkspaceStateForViewer(currentViewer.id),
    );
    const guestViewer = await createGuestViewerProfile();

    await persistWorkspaceStateForViewer(guestViewer.id, currentState);
    await setViewerCookie(guestViewer.access_token);

    return {
      remoteAvailable: true,
      viewerKind: "guest" as const,
      state: await loadWorkspaceStateForViewer(guestViewer.id),
    };
  } catch (error) {
    if (isWorkspaceSchemaUnavailableError(error)) {
      return getRemoteDisabledState();
    }

    throw error;
  }
}
