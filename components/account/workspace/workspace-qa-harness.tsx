"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

import {
  SignalAchievementFlagsProvider,
  SignalProgressUiProvider,
} from "@/lib/signal-progression/release-context";

import { LoopShellProvider } from "@/components/layout/loop-shell-context";
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
  fixture?: "new" | "mature" | "quiet" | "review" | "compare" | "stacks" | "resume";
  view?: WorkspaceView;
  surface?: "workspace" | "settings";
}) {
  const state = useMemo(() => {
    if (fixture === "new") return workspaceTestFixtures.newAuthenticated;
    if (fixture === "quiet") return workspaceTestFixtures.quietReturning;
    if (fixture === "review") return workspaceTestFixtures.reviewDue;
    if (fixture === "compare") return workspaceTestFixtures.withCompare;
    if (fixture === "stacks") return workspaceTestFixtures.withStacks;
    if (fixture === "resume") return workspaceTestFixtures.withDecisions;
    return workspaceTestFixtures.mature;
  }, [fixture]);
  const initialView = WORKSPACE_VIEWS.includes(view) ? view : "riprendi";

  const [ready, setReady] = useState(false);
  const previousOwner = useRef<ReturnType<typeof getActiveWorkspaceOwner> | null>(null);
  useEffect(() => {
    const previous = getActiveWorkspaceOwner();
    previousOwner.current = previous;
    activateVolatileToolWorkspaceOwnerWithoutStorage(QA_OWNER, state);
    setReady(true);
    return () => {
      if (previous) activateToolWorkspaceOwner(previous);
    };
  }, [state]);

  return (
    <SignalProgressUiProvider enabled>
      <SignalAchievementFlagsProvider
        flags={{
          achievementsEnabled: true,
          badgeCabinetEnabled: true,
          milestonesEnabled: true,
        }}
      >
        <DiscoveryPersistenceProvider>
          <AccountPreviewProvider value={previewAccount}>
            {surface === "settings" ? (
              <AccountSettingsPage />
            ) : ready ? (
              <LoopShellProvider>
                <WorkspaceShell initialView={initialView} />
              </LoopShellProvider>
            ) : (
              <p>Apertura spazio…</p>
            )}
          </AccountPreviewProvider>
        </DiscoveryPersistenceProvider>
      </SignalAchievementFlagsProvider>
    </SignalProgressUiProvider>
  );
}
