"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useAccount } from "@/components/account/account-provider";
import { useDiscoveryPersistence } from "@/components/discovery/canonical-discovery-persistence-provider";
import {
  readWorkspaceHud,
  workspaceHudInstruments,
} from "@/lib/account/workspace-hud";
import { useSignalProgressUiEnabled } from "@/lib/signal-progression/release-context";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import {
  getHeroBadgeLabel,
  getPersistenceLabel,
} from "@/components/account/panel/account-panel-model";

import { useCanonicalWorkspace } from "./use-canonical-workspace";
import {
  WORKSPACE_DISCOVER_LINKS,
  WORKSPACE_PRIMARY_VIEWS,
  WORKSPACE_SECONDARY_VIEWS,
  WORKSPACE_VIEW_KICKERS,
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
  count,
}: {
  view: WorkspaceView;
  currentView: WorkspaceView;
  surface: AccountWorkspaceSurface;
  variant: "primary" | "secondary";
  count?: number;
}) {
  const current = isViewCurrent(view, currentView, surface);
  const label = WORKSPACE_VIEW_LABELS[view];
  return (
    <Link
      href={workspaceViewHref(view)}
      className={`tv-app__nav-link tv-app__nav-link--${variant}`}
      aria-current={current ? "page" : undefined}
      aria-label={label}
    >
      {label}
      {count != null && count > 0 ? (
        <span className="tv-app__nav-count" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function DiscoverLinks({ compareCount }: { compareCount: number }) {
  return (
    <>
      {WORKSPACE_DISCOVER_LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="tv-app__nav-link tv-app__nav-link--secondary"
          aria-label={item.label}
        >
          {item.label}
          {item.href === "/compare" && compareCount > 0 ? (
            <span className="tv-app__nav-count" aria-hidden="true">
              {compareCount}
            </span>
          ) : null}
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

function SearchControl() {
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);
  return (
    <button
      type="button"
      className="tv-app__search"
      onClick={() => setCommandOpen(true)}
      aria-label="Cerca nel toolbox"
    >
      Cerca
      <kbd className="tv-app__search-kbd">⌘K</kbd>
    </button>
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
      Esci
    </button>
  );
}

function WorkspaceHudBar() {
  const state = useCanonicalWorkspace();
  const instruments = workspaceHudInstruments(readWorkspaceHud(state));
  return (
    <nav className="tv-hud" aria-label="Stato del toolbox">
      {instruments.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={item.active ? "tv-hud__item is-active" : "tv-hud__item"}
        >
          <span className="tv-hud__value">{item.value}</span>
          <span className="tv-hud__label">{item.label}</span>
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
  const hud = readWorkspaceHud(useCanonicalWorkspace());

  useEffect(() => {
    document.body.dataset.accountSurface = resolvedSurface;
    return () => {
      delete document.body.dataset.accountSurface;
    };
  }, [resolvedSurface]);

  const selectValue =
    resolvedSurface === "settings" ? "/account/settings" : workspaceViewHref(view);
  const signalUi = useSignalProgressUiEnabled();
  const secondaryViews = useMemo(
    () =>
      WORKSPACE_SECONDARY_VIEWS.filter(
        (item) => item !== "segnale" || signalUi,
      ),
    [signalUi],
  );
  const workCounts: Partial<Record<WorkspaceView, number>> = {
    biblioteca: hud.saved,
    stack: hud.stacks,
    decisioni: hud.traces,
  };

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
                count={workCounts[item]}
              />
            ))}
          </div>
          {secondaryViews.length > 0 ? (
            <div className="tv-app__nav-group">
              <p className="tv-app__nav-label">Memoria</p>
              {secondaryViews.map((item) => (
                <WorkspaceNavLink
                  key={item}
                  view={item}
                  currentView={view}
                  surface={resolvedSurface}
                  variant="secondary"
                />
              ))}
            </div>
          ) : null}
          <div className="tv-app__nav-group">
            <p className="tv-app__nav-label">Scopri</p>
            <DiscoverLinks compareCount={hud.compare} />
          </div>
        </nav>
        <div className="tv-app__aside-foot">
          <SearchControl />
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
          <div className="tv-app__mobile-tools">
            <SearchControl />
            <AccountIdentity email={email} compact />
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
        <nav className="tv-app__mobile-chips" aria-label="Spazio personale">
          {WORKSPACE_PRIMARY_VIEWS.map((item) => (
            <WorkspaceNavLink
              key={item}
              view={item}
              currentView={view}
              surface={resolvedSurface}
              variant="primary"
              count={workCounts[item]}
            />
          ))}
          {secondaryViews.map((item) => (
            <WorkspaceNavLink
              key={item}
              view={item}
              currentView={view}
              surface={resolvedSurface}
              variant="secondary"
            />
          ))}
          <DiscoverLinks compareCount={hud.compare} />
        </nav>
        <div className="tv-app__mobile-meta">
          <AccountSyncLine
            persistenceLabel={persistenceLabel}
            attachLabel={attachLabel}
            showLocalHint={account.workspaceAttachPending}
          />
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
            <optgroup label="Il tuo lavoro">
              {WORKSPACE_PRIMARY_VIEWS.map((item) => (
                <option key={item} value={workspaceViewHref(item)}>
                  {WORKSPACE_VIEW_LABELS[item]}
                </option>
              ))}
            </optgroup>
            {secondaryViews.length > 0 ? (
              <optgroup label="Memoria">
                {secondaryViews.map((item) => (
                  <option key={item} value={workspaceViewHref(item)}>
                    {WORKSPACE_VIEW_LABELS[item]}
                  </option>
                ))}
              </optgroup>
            ) : null}
            <optgroup label="Scopri">
              {WORKSPACE_DISCOVER_LINKS.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Account">
              <option value="/account/settings">Impostazioni</option>
            </optgroup>
          </select>
        </label>
      </div>

      <div className="tv-app__tablet">
        <div className="tv-app__tablet-bar">
          <Link href={workspaceViewHref("riprendi")} className="tv-app__brand">
            TOOOLVIBES
          </Link>
          <div className="tv-app__tablet-tools">
            <SearchControl />
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
              count={workCounts[item]}
            />
          ))}
        </nav>
        <nav className="tv-app__tablet-secondary" aria-label="Altre destinazioni">
          {secondaryViews.map((item) => (
            <WorkspaceNavLink
              key={item}
              view={item}
              currentView={view}
              surface={resolvedSurface}
              variant="secondary"
            />
          ))}
          <DiscoverLinks compareCount={hud.compare} />
        </nav>
        <AccountSyncLine
          persistenceLabel={persistenceLabel}
          attachLabel={attachLabel}
          showLocalHint={account.workspaceAttachPending}
        />
      </div>

      <div className="tv-app__main">
        <div className="tv-app__canvas">
          <WorkspaceHudBar />
          <WorkspacePageHead surface={resolvedSurface} view={view} />
          {children}
        </div>
      </div>
    </div>
  );
}
