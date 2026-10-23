"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current) return;
    const viewport = nav.getBoundingClientRect();
    const item = current.getBoundingClientRect();
    if (viewport.width === 0) return;
    const delta = item.left < viewport.left + 8
      ? item.left - viewport.left - 8
      : item.right > viewport.right - 8
        ? item.right - viewport.right + 8
        : 0;
    nav.scrollLeft += delta;
  }, [surface, view]);

  const items = [
    { href: personalDashboardHref(), label: "Il tuo spazio", current: surface === "workspace" && view === "riprendi" },
    { href: workspaceViewHref("salvati"), label: "Salvati", current: surface === "workspace" && view === "salvati" },
    { href: workspaceViewHref("stack"), label: "Stack", current: surface === "workspace" && view === "stack" },
    { href: workspaceViewHref("decisioni"), label: "Decisioni", current: surface === "workspace" && view === "decisioni" },
    { href: "/account/settings", label: "Impostazioni", current: surface === "settings" },
  ];
  return (
    <LocalizedAttributes><nav ref={navRef} className="tv-space-switch" aria-label="Il tuo spazio">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch={false}
          aria-current={item.current ? "page" : undefined}
          className={item.current ? "is-current" : undefined}
        >
          <LocalizedText>{item.label}</LocalizedText>
        </Link>
      ))}
    </nav></LocalizedAttributes>
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
  if (view === "riprendi") {
    return (
      <header className="tv-app__pagehead">
        <p className="tv-app__page-kicker"><LocalizedText>{"Spazio"}</LocalizedText></p>
        <h1 className="tv-app__page-title"><LocalizedText>{"Bentornato 👋"}</LocalizedText></h1>
        <p className="tv-app__page-lede"><LocalizedText>{"Cosa vuoi fare oggi?"}</LocalizedText></p>
      </header>
    );
  }
  return (
    <header className="tv-app__pagehead">
      <p className="tv-app__page-kicker"><LocalizedText>{WORKSPACE_VIEW_KICKERS[view]}</LocalizedText></p>
      <h1 className="tv-app__page-title"><LocalizedText>{WORKSPACE_VIEW_LABELS[view]}</LocalizedText></h1>
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
