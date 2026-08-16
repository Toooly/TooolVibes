"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  AccountPreviewProvider,
  type AccountContextValue,
} from "@/components/account/account-provider";
import { AccountSettingsPage } from "@/components/account/account-settings-page";
import { DiscoveryPersistenceProvider } from "@/components/discovery/canonical-discovery-persistence-provider";
import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import {
  activateToolWorkspaceOwner,
  activateVolatileToolWorkspaceOwnerWithoutStorage,
} from "@/lib/stores/tool-workspace-store";

import { WorkspaceShell } from "./workspace-shell";
import { WORKSPACE_VIEWS, type WorkspaceView } from "./workspace-model";

const QA_OWNER = { kind: "account" as const, userId: "local-qa-preview" };

const previewAccount: AccountContextValue = {
  authEnabled: true,
  status: "authenticated",
  user: {
    id: "local-qa-preview",
    email: "qa.local@tooolvibes.dev",
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00.000Z",
  } as AccountContextValue["user"],
  session: null,
  isSendingLink: false,
  isAttaching: false,
  workspaceAttachPending: false,
  hasQuarantinedWorkspace: false,
  isRestoringQuarantinedWorkspace: false,
  authMessage: null,
  sendMagicLink: async () => ({ ok: false, message: "QA locale: nessun magic link." }),
  restoreQuarantinedWorkspace: async () => ({
    ok: false,
    message: "QA locale: nessun backup.",
  }),
  signOut: async () => {},
};

export function WorkspaceQaHarness({
  fixture = "mature",
  view = "riprendi",
  surface = "workspace",
}: {
  fixture?: "new" | "mature";
  view?: WorkspaceView;
  surface?: "workspace" | "settings";
}) {
  const state = useMemo(
    () =>
      fixture === "new"
        ? workspaceTestFixtures.newAuthenticated
        : workspaceTestFixtures.mature,
    [fixture],
  );
  const initialView = WORKSPACE_VIEWS.includes(view) ? view : "riprendi";

  const previousOwner = useRef<ReturnType<typeof getActiveWorkspaceOwner> | null>(null);
  if (typeof window !== "undefined") {
    if (!previousOwner.current) {
      previousOwner.current = getActiveWorkspaceOwner();
    }
    activateVolatileToolWorkspaceOwnerWithoutStorage(QA_OWNER, state);
  }
  useEffect(() => {
    const previous = previousOwner.current;
    return () => {
      if (previous) activateToolWorkspaceOwner(previous);
    };
  }, []);

  return (
    <DiscoveryPersistenceProvider>
      <AccountPreviewProvider value={previewAccount}>
        {surface === "settings" ? (
          <AccountSettingsPage />
        ) : (
          <WorkspaceShell initialView={initialView} />
        )}
      </AccountPreviewProvider>
    </DiscoveryPersistenceProvider>
  );
}
