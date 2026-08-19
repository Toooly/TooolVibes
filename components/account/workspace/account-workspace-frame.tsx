"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAccount } from "@/components/account/account-provider";
import { useDiscoveryPersistence } from "@/components/discovery/canonical-discovery-persistence-provider";
import {
  getHeroBadgeLabel,
  getPersistenceLabel,
} from "@/components/account/panel/account-panel-model";

import {
  WORKSPACE_DISCOVER_LINKS,
  WORKSPACE_PRIMARY_VIEWS,
  WORKSPACE_SECONDARY_VIEWS,
  WORKSPACE_VIEW_LABELS,
  emailLocalPart,
  initialsFromEmail,
  workspaceViewHref,
  type WorkspaceView,
} from "./workspace-model";

export type AccountWorkspaceSurface = "workspace" | "settings";

function isViewCurrent(
  view: WorkspaceView,
  currentView: WorkspaceView,
  surface: AccountWorkspaceSurface,
): boolean {
  return surface === "workspace" && view === currentView;
}

function WorkspaceNavLink({
  view,
  currentView,
  surface,
  variant,
}: {
  view: WorkspaceView;
  currentView: WorkspaceView;
  surface: AccountWorkspaceSurface;
  variant: "primary" | "secondary";
}) {
  const current = isViewCurrent(view, currentView, surface);
  return (
    <Link
      href={workspaceViewHref(view)}
      className={`tv-app__nav-link tv-app__nav-link--${variant}`}
      aria-current={current ? "page" : undefined}
    >
      {WORKSPACE_VIEW_LABELS[view]}
    </Link>
  );
}

function DiscoverLinks() {
  return (
    <>
      {WORKSPACE_DISCOVER_LINKS.map((item) => (
        <Link key={item.href} href={item.href} className="tv-app__nav-link tv-app__nav-link--secondary">
          {item.label}
        </Link>
      ))}
    </>
  );
}

function AccountIdentity({
  email,
  compact = false,
}: {
  email: string | null | undefined;
  compact?: boolean;
}) {
  const initials = initialsFromEmail(email);
  const local = emailLocalPart(email);
  if (compact) {
    return (
      <span className="tv-app__identity tv-app__identity--compact" title={local}>
        <span className="tv-app__initials" aria-hidden="true">
          {initials}
        </span>
        <span className="sr-only">{local}</span>
      </span>
    );
  }
  return (
    <div className="tv-app__identity">
      <span className="tv-app__initials" aria-hidden="true">
        {initials}
      </span>
      <span className="tv-app__identity-name">{local}</span>
    </div>
  );
}

function AccountSyncLine({
  persistenceLabel,
  attachLabel,
  showLocalHint,
}: {
  persistenceLabel: string;
  attachLabel: string | null;
  showLocalHint: boolean;
}) {
  return (
    <p className="tv-app__sync">
      {attachLabel ?? persistenceLabel}
      {showLocalHint ? (
        <>
          {" · "}
          <span>Su questo dispositivo</span>
        </>
      ) : null}
    </p>
  );
}

function SignOutControl({ onSignOut }: { onSignOut: () => void }) {
  return (
    <button
      type="button"
      className="tv-app__signout"
      onClick={onSignOut}
      aria-label="Esci dall'account"
    >
      Esci dall&apos;account
    </button>
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
  const account = useAccount();
  const persistence = useDiscoveryPersistence();
  const pathname = usePathname() ?? "/account";
  const router = useRouter();
  const email = account.user?.email ?? null;
  const persistenceLabel = getPersistenceLabel(persistence);
  const attachLabel =
    account.isAttaching || account.workspaceAttachPending
      ? getHeroBadgeLabel(account)
      : null;
  const resolvedSurface: AccountWorkspaceSurface =
    surface === "settings" || pathname === "/account/settings" || pathname.startsWith("/account/settings/")
      ? "settings"
      : "workspace";

  useEffect(() => {
    document.body.dataset.accountSurface = resolvedSurface;
    return () => {
      delete document.body.dataset.accountSurface;
    };
  }, [resolvedSurface]);

  const selectValue =
    resolvedSurface === "settings" ? "" : workspaceViewHref(view);

  return (
    <div
      id="member-access"
      className="tv-app"
      data-account-surface={resolvedSurface}
    >
      <aside className="tv-app__sidebar">
        <Link href={workspaceViewHref("riprendi")} className="tv-app__brand">
          TOOOLVIBES
        </Link>
        <nav className="tv-app__nav" aria-label="Spazio personale">
          <div className="tv-app__nav-group">
            <WorkspaceNavLink
              view="riprendi"
              currentView={view}
              surface={resolvedSurface}
              variant="primary"
            />
          </div>
          <div className="tv-app__nav-group">
            <p className="tv-app__nav-label">Il tuo lavoro</p>
            {WORKSPACE_PRIMARY_VIEWS.filter((item) => item !== "riprendi").map((item) => (
              <WorkspaceNavLink
                key={item}
                view={item}
                currentView={view}
                surface={resolvedSurface}
                variant="primary"
              />
            ))}
          </div>
          <div className="tv-app__nav-group">
            <p className="tv-app__nav-label">Scopri</p>
            <DiscoverLinks />
          </div>
          <div className="tv-app__nav-group">
            {WORKSPACE_SECONDARY_VIEWS.map((item) => (
              <WorkspaceNavLink
                key={item}
                view={item}
                currentView={view}
                surface={resolvedSurface}
                variant="secondary"
              />
            ))}
          </div>
        </nav>
        <div className="tv-app__aside-foot">
          <Link
            href="/account/settings"
            className="tv-app__nav-link"
            aria-current={resolvedSurface === "settings" ? "page" : undefined}
          >
            Impostazioni
          </Link>
          <AccountIdentity email={email} />
          <AccountSyncLine
            persistenceLabel={persistenceLabel}
            attachLabel={attachLabel}
            showLocalHint={account.workspaceAttachPending}
          />
          <SignOutControl onSignOut={() => void account.signOut()} />
        </div>
      </aside>

      <div className="tv-app__mobile">
        <div className="tv-app__mobile-bar">
          <Link href={workspaceViewHref("riprendi")} className="tv-app__brand">
            TOOOLVIBES
          </Link>
          <AccountIdentity email={email} compact />
        </div>
        <label className="tv-app__mobile-select">
          <span className="sr-only">Vai a</span>
          <select
            value={selectValue}
            onChange={(event) => {
              const next = event.target.value;
              if (next) router.push(next);
            }}
          >
            {resolvedSurface === "settings" ? (
              <option value="" disabled>
                Vai a…
              </option>
            ) : null}
            <optgroup label="Il tuo lavoro">
              {WORKSPACE_PRIMARY_VIEWS.map((item) => (
                <option key={item} value={workspaceViewHref(item)}>
                  {WORKSPACE_VIEW_LABELS[item]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Altro">
              {WORKSPACE_SECONDARY_VIEWS.map((item) => (
                <option key={item} value={workspaceViewHref(item)}>
                  {WORKSPACE_VIEW_LABELS[item]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Scopri">
              {WORKSPACE_DISCOVER_LINKS.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <div className="tv-app__mobile-meta">
          <Link
            href="/account/settings"
            className="tv-app__settings-link"
            aria-current={resolvedSurface === "settings" ? "page" : undefined}
          >
            Impostazioni
          </Link>
          <SignOutControl onSignOut={() => void account.signOut()} />
        </div>
      </div>

      <div className="tv-app__tablet">
        <div className="tv-app__tablet-bar">
          <Link href={workspaceViewHref("riprendi")} className="tv-app__brand">
            TOOOLVIBES
          </Link>
          <div className="tv-app__tablet-tools">
            <Link
              href="/account/settings"
              className="tv-app__settings-link"
              aria-current={resolvedSurface === "settings" ? "page" : undefined}
            >
              Impostazioni
            </Link>
            <AccountIdentity email={email} compact />
            <SignOutControl onSignOut={() => void account.signOut()} />
          </div>
        </div>
        <nav className="tv-app__tablet-primary" aria-label="Spazio personale">
          {WORKSPACE_PRIMARY_VIEWS.map((item) => (
            <WorkspaceNavLink
              key={item}
              view={item}
              currentView={view}
              surface={resolvedSurface}
              variant="primary"
            />
          ))}
        </nav>
        <nav className="tv-app__tablet-secondary" aria-label="Altre destinazioni">
          {WORKSPACE_SECONDARY_VIEWS.map((item) => (
            <WorkspaceNavLink
              key={item}
              view={item}
              currentView={view}
              surface={resolvedSurface}
              variant="secondary"
            />
          ))}
          <DiscoverLinks />
        </nav>
        <AccountSyncLine
          persistenceLabel={persistenceLabel}
          attachLabel={attachLabel}
          showLocalHint={account.workspaceAttachPending}
        />
      </div>

      <div className="tv-app__main">
        <div className="tv-app__canvas">{children}</div>
      </div>
    </div>
  );
}
