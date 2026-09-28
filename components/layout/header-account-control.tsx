"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { User, UserPlus } from "lucide-react";

import { useAccount } from "@/components/account/account-provider";
import {
  personalDashboardHref,
  workspaceViewHref,
} from "@/components/account/workspace/workspace-model";
import { useHeaderAccountCta } from "@/components/layout/workspace-nav-selectors";

export function HeaderAccountControl({
  linkClassName,
  menuClassName,
  panelClassName,
  showLabel = true,
  floating = false,
}: {
  linkClassName: string;
  menuClassName: string;
  panelClassName: string;
  showLabel?: boolean;
  floating?: boolean;
}) {
  const account = useAccount();
  const accountCta = useHeaderAccountCta();
  const accountIcon =
    accountCta.state === "guest" || accountCta.state === "legacy"
      ? UserPlus
      : User;

  if (!accountCta.visible) return null;

  if (accountCta.state === "authenticated" || accountCta.state === "syncing") {
    if (floating) {
      return (
        <FloatingAccountMenu
          linkClassName={linkClassName}
          menuClassName={menuClassName}
          panelClassName={panelClassName}
          label={accountCta.label || "Account"}
          busy={accountCta.ariaBusy}
          onSignOut={() => void account.signOut()}
        />
      );
    }
    return (
      <details className={menuClassName}>
        <summary
          className={linkClassName}
          aria-label={accountCta.label || "Account"}
          aria-busy={accountCta.ariaBusy || undefined}
        >
          <User size={showLabel ? 14 : 18} aria-hidden="true" />
          {showLabel ? (
            <span className="command-bar__account-label">
              {accountCta.label || "Account"}
            </span>
          ) : null}
        </summary>
        <div className={panelClassName}>
          <AccountMenuLinks onSignOut={() => void account.signOut()} />
        </div>
      </details>
    );
  }

  const Icon = accountIcon;
  return (
    <Link
      href={accountCta.href}
      prefetch={false}
      className={linkClassName}
      aria-label={accountCta.label || "Account"}
      aria-busy={accountCta.ariaBusy || undefined}
    >
      <Icon size={showLabel ? 14 : 18} aria-hidden="true" />
      {showLabel ? (
        <span className="command-bar__account-label">
          {accountCta.label || "Account"}
        </span>
      ) : null}
    </Link>
  );
}

function AccountMenuLinks({ onSignOut }: { onSignOut: () => void }) {
  return (
    <>
      <Link href={personalDashboardHref()} prefetch={false}>Il tuo spazio</Link>
      <Link href={workspaceViewHref("salvati")} prefetch={false}>Salvati</Link>
      <Link href={workspaceViewHref("stack")} prefetch={false}>Stack</Link>
      <Link href={workspaceViewHref("decisioni")} prefetch={false}>Decisioni</Link>
      <Link href="/account/settings" prefetch={false}>Impostazioni</Link>
      <button type="button" className="is-destructive" onClick={onSignOut}>Esci</button>
    </>
  );
}

function FloatingAccountMenu({
  linkClassName,
  menuClassName,
  panelClassName,
  label,
  busy,
  onSignOut,
}: {
  linkClassName: string;
  menuClassName: string;
  panelClassName: string;
  label: string;
  busy?: boolean;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const [box, setBox] = useState({ top: 0, right: 12 });

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBox({ top: rect.bottom + 8, right: Math.max(12, window.innerWidth - rect.right) });
    };
    place();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector("a")?.focus();
  }, [open]);

  return (
    <div className={menuClassName}>
      <button
        ref={buttonRef}
        type="button"
        className={linkClassName}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-busy={busy || undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <User size={18} aria-hidden="true" />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <>
              <button type="button" className="td-final-account-scrim" aria-label="Chiudi menu account" onClick={() => setOpen(false)} />
              <div
                ref={panelRef}
                className={panelClassName}
                role="menu"
                aria-labelledby={titleId}
                style={{ top: box.top, right: box.right }}
              >
                <p id={titleId} className="td-final-account-menu__title">Il tuo spazio</p>
                <AccountMenuLinks onSignOut={() => { setOpen(false); onSignOut(); }} />
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
