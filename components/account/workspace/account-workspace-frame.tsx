"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { readRewardPreferences } from "@/lib/rewards/preferences";

import {
  WORKSPACE_VIEW_KICKERS,
  WORKSPACE_VIEW_LABELS,
  type WorkspaceView,
} from "./workspace-model";

export type AccountWorkspaceSurface = "workspace" | "settings";

function AccountMotionSync() {
  useEffect(() => {
    const apply = () => {
      if (readRewardPreferences().reduceRewardAnimations) {
        document.documentElement.dataset.tvReduceMotion = "true";
      } else {
        delete document.documentElement.dataset.tvReduceMotion;
      }
    };
    apply();
    window.addEventListener("storage", apply);
    return () => window.removeEventListener("storage", apply);
  }, []);
  return null;
}

function WorkspacePageHead({
  surface,
  view,
}: {
  surface: AccountWorkspaceSurface;
  view: WorkspaceView;
}) {
  if (surface === "settings") return null;
  if (view === "riprendi") return null;
  return (
    <header className="tv-app__pagehead">
      <p className="tv-app__page-kicker">{WORKSPACE_VIEW_KICKERS[view]}</p>
      <h1 className="tv-app__page-title">{WORKSPACE_VIEW_LABELS[view]}</h1>
    </header>
  );
}

export function AccountWorkspaceFrame({
  children,
  surface = "workspace",
  view = "riprendi",
}: {
  children: React.ReactNode;
  surface?: AccountWorkspaceSurface;
  view?: WorkspaceView;
}) {
  const pathname = usePathname() ?? "/account";
  const resolvedSurface: AccountWorkspaceSurface =
    surface === "settings" ||
    pathname === "/account/settings" ||
    pathname.startsWith("/account/settings/")
      ? "settings"
      : "workspace";

  useEffect(() => {
    document.body.dataset.accountSurface = resolvedSurface;
    return () => {
      delete document.body.dataset.accountSurface;
    };
  }, [resolvedSurface]);

  return (
    <div
      id="member-access"
      className="tv-app tv-app--atelier tv-app--loop"
      data-account-surface={resolvedSurface}
    >
      <AccountMotionSync />
      <div className="tv-app__main">
        <div className="tv-app__canvas">
          <WorkspacePageHead surface={resolvedSurface} view={view} />
          {children}
        </div>
      </div>
    </div>
  );
}
