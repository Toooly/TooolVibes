"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { readRewardPreferences } from "@/lib/rewards/preferences";

import {
  personalDashboardHref,
  WORKSPACE_VIEW_KICKERS,
  WORKSPACE_VIEW_LABELS,
  workspaceViewHref,
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

function WorkspaceInteriorNav({
  surface,
  view,
}: {
  surface: AccountWorkspaceSurface;
  view: WorkspaceView;
}) {
  const items = [
    { href: personalDashboardHref(), label: "Il tuo spazio", current: surface === "workspace" && view === "riprendi" },
    { href: workspaceViewHref("salvati"), label: "Salvati", current: surface === "workspace" && view === "salvati" },
    { href: workspaceViewHref("stack"), label: "Stack", current: surface === "workspace" && view === "stack" },
    { href: "/account/settings", label: "Impostazioni", current: surface === "settings" },
  ];
  return (
    <nav className="tv-space-switch" aria-label="Il tuo spazio">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch={false}
          aria-current={item.current ? "page" : undefined}
          className={item.current ? "is-current" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
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
          <WorkspaceInteriorNav surface={resolvedSurface} view={view} />
          <WorkspacePageHead surface={resolvedSurface} view={view} />
          {children}
        </div>
      </div>
    </div>
  );
}
