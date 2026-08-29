"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  AccountPreviewProvider,
  type AccountContextValue,
} from "@/components/account/account-provider";
import { AuthContinuationProvider, useAuthContinuation } from "@/components/account/auth-continuation-provider";
import { AuthSheet } from "@/components/account/auth-sheet";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { PrivateNoteEditor } from "@/components/account/workspace/private-note-editor";
import { PersonalInsightsLayer } from "@/components/account/workspace/personal-insights-layer";
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
  workspaceReadyForIntentReplay: true,
};

const guestPreviewAccount: AccountContextValue = {
  ...previewAccount,
  status: "guest",
  user: null,
  workspaceReadyForIntentReplay: false,
};

export function WorkspaceQaHarness({
  fixture = "mature",
  view = "riprendi",
  surface = "workspace",
}: {
  fixture?: "new" | "mature" | "quiet" | "review" | "compare" | "stacks" | "resume" | "few" | "using" | "empty" | "multistack";
  view?: WorkspaceView;
  surface?: "workspace" | "settings" | "auth-sheet" | "auth-sheet-note" | "auth-sheet-insight" | "legacy-stack" | "private-note" | "private-note-guest" | "personal-search" | "personal-search-guest" | "deep-compare" | "deep-compare-guest" | "personal-insights" | "personal-insights-guest";
}) {
  const state = useMemo(() => {
    if (fixture === "new" || fixture === "empty") return workspaceTestFixtures.newAuthenticated;
    if (fixture === "quiet" || fixture === "using") return workspaceTestFixtures.quietReturning;
    if (fixture === "review") return workspaceTestFixtures.reviewDue;
    if (fixture === "compare") return workspaceTestFixtures.withCompare;
    if (fixture === "stacks") return workspaceTestFixtures.withStacks;
    if (fixture === "resume") return workspaceTestFixtures.withDecisions;
    if (fixture === "few") return workspaceTestFixtures.fewSaved;
    if (fixture === "multistack") return workspaceTestFixtures.multiStack;
    return workspaceTestFixtures.mature;
  }, [fixture]);
  const initialView = WORKSPACE_VIEWS.includes(view) ? view : "riprendi";

  const [ready, setReady] = useState(false);
  const previousOwner = useRef<ReturnType<typeof getActiveWorkspaceOwner> | null>(null);
  useEffect(() => {
    const previous = getActiveWorkspaceOwner();
    previousOwner.current = previous;
    if (surface === "legacy-stack") {
      activateVolatileToolWorkspaceOwnerWithoutStorage(
        { kind: "guest" },
        workspaceTestFixtures.withStacks,
      );
    } else {
      activateVolatileToolWorkspaceOwnerWithoutStorage(QA_OWNER, state);
    }
    setReady(true);
    return () => {
      if (previous) activateToolWorkspaceOwner(previous);
    };
  }, [state, surface]);

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
          <AccountPreviewProvider
            value={surface === "auth-sheet" || surface === "auth-sheet-note" || surface === "auth-sheet-insight" || surface === "legacy-stack" || surface === "private-note-guest" || surface === "personal-search-guest" || surface === "deep-compare-guest" || surface === "personal-insights-guest" ? guestPreviewAccount : previewAccount}
          >
            {surface === "personal-search" || surface === "personal-search-guest" ? (
              <PersonalSearchQa
                guest={surface === "personal-search-guest"}
              />
            ) : surface === "deep-compare" || surface === "deep-compare-guest" ? (
              <DeepCompareQa guest={surface === "deep-compare-guest"} />
            ) : surface === "settings" ? (
              <AccountSettingsPage />
            ) : surface === "auth-sheet" || surface === "auth-sheet-note" || surface === "auth-sheet-insight" ? (
              <div
                data-auth-sheet-qa=""
                className="min-h-dvh bg-[var(--tv-bg)] p-6 text-[var(--tv-ink-primary)]"
              >
                <AuthSheet
                  open
                  draft={
                    surface === "auth-sheet-note"
                      ? {
                          capability: "note.private",
                          toolSlug: "cursor",
                          returnTo: "/toools/cursor",
                          origin: "note.tool",
                        }
                      : surface === "auth-sheet-insight"
                        ? {
                            capability: "insight.personal",
                            toolSlug: "cursor",
                            returnTo: "/toools/cursor",
                            origin: "insight.tool",
                          }
                      : {
                          toolSlug: "cursor",
                          desiredStackName: "AI Coding",
                          returnTo: "/toools/cursor",
                          origin: "save-overflow",
                        }
                  }
                  onOpenChange={() => {}}
                />
              </div>
            ) : surface === "personal-insights" || surface === "personal-insights-guest" ? (
              <OverlayProvider>
                <AuthContinuationProvider>
                  <div
                    data-personal-insights-qa=""
                    className="min-h-dvh bg-[var(--tv-bg)] p-6 text-[var(--tv-ink-primary)]"
                  >
                    <PersonalInsightsLayer slug="cursor" origin="tool" />
                  </div>
                </AuthContinuationProvider>
              </OverlayProvider>
            ) : surface === "private-note" || surface === "private-note-guest" ? (
              <OverlayProvider>
                <AuthContinuationProvider>
                  <div
                    data-private-note-qa=""
                    className="min-h-dvh bg-[var(--tv-bg)] p-6 text-[var(--tv-ink-primary)]"
                  >
                    <PrivateNoteEditor slug="cursor" origin="tool" />
                  </div>
                </AuthContinuationProvider>
              </OverlayProvider>
            ) : surface === "legacy-stack" ? (
              <AuthContinuationProvider>
                <LegacyStackQa />
              </AuthContinuationProvider>
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

function LegacyStackQa() {
  const continuation = useAuthContinuation();
  const leftover = workspaceTestFixtures.withStacks;
  const name = leftover.personalStacks[0]?.name ?? "AI Coding";
  const id = leftover.personalStacks[0]?.id ?? "ai-coding";
  return (
    <div
      data-legacy-stack-qa=""
      className="min-h-dvh bg-[var(--tv-bg)] p-6 text-[var(--tv-ink-primary)]"
    >
      <p className="tv-auth-sheet__eyebrow">Stack locale</p>
      <h1 className="font-heading text-xl">{name}</h1>
      <p className="text-sm text-[var(--tv-ink-secondary)]">
        {leftover.personalStacks[0]?.slugs.join(", ") || "Cursor, Claude Code"}
      </p>
      <button
        type="button"
        className="mt-4 min-h-11 rounded-full bg-[var(--tv-accent-aa)] px-4 text-white"
        onClick={() =>
          continuation.requestStackCreate({
            toolSlug: "windsurf",
            targetStackId: id,
            targetStackName: name,
            origin: "save-overflow",
          })
        }
      >
        Aggiungi Windsurf
      </button>
    </div>
  );
}

function PersonalSearchQa({ guest }: { guest: boolean }) {
  return (
    <div
      data-personal-search-qa=""
      className="min-h-dvh bg-[var(--tv-bg)] p-6 text-[var(--tv-ink-primary)]"
    >
      <AuthSheet
        open={guest}
        draft={
          guest
            ? {
                capability: "search.personal",
                query: "usage:using",
                returnTo: "/archivio",
                origin: "command-palette",
              }
            : null
        }
        onOpenChange={() => {}}
      />
      {!guest ? (
        <p className="tv-auth-sheet__title">usage:using · note:yes · stack:AI Coding</p>
      ) : null}
    </div>
  );
}


function DeepCompareQa({ guest }: { guest: boolean }) {
  return (
    <div
      data-deep-compare-qa=""
      className="min-h-dvh bg-[var(--tv-bg)] p-6 text-[var(--tv-ink-primary)]"
    >
      <AuthContinuationProvider>
        <AuthSheet
          open={guest}
          draft={
            guest
              ? {
                  capability: "compare.deep",
                  returnTo: "/compare",
                  origin: "compare.deep",
                }
              : null
          }
          onOpenChange={() => {}}
        />
        {!guest ? (
          <div>
            <p className="compare-personal__eyebrow">Il tuo contesto</p>
            <p className="compare-personal__chip">In uso</p>
            <p className="compare-personal__chip">Stack: AI Coding</p>
            <p className="compare-personal__chip">Nota presente</p>
          </div>
        ) : null}
      </AuthContinuationProvider>
    </div>
  );
}
