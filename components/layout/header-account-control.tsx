"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "@/components/ui/app-link";
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
  const menuRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const menu = menuRef.current;
      // The mobile backdrop is a details pseudo-element: its taps target the menu itself.
      if (menu?.open && event.target instanceof Node &&
        (event.target === menu || !menu.contains(event.target))) {
        menu.open = false;
      }
    };
    const onKey = (event: KeyboardEvent) => {
      const menu = menuRef.current;
      if (event.key === "Escape" && menu?.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    };
    // Capture outside taps before other shell controls can stop propagation.
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
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
      <details ref={menuRef} className={menuClassName}>
        <LocalizedAttributes><summary
          className={linkClassName}
          aria-label={accountCta.label || "Account"}
          aria-busy={accountCta.ariaBusy || undefined}
        >
          <User size={showLabel ? 14 : 18} aria-hidden="true" />
          {showLabel ? (
            <span className="command-bar__account-label">
              <LocalizedText>{accountCta.label || "Account"}</LocalizedText>
            </span>
          ) : null}
        </summary></LocalizedAttributes>
        <div
          data-account-menu-panel=""
          className={panelClassName}
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a, button") && menuRef.current) {
              menuRef.current.open = false;
            }
          }}
        >
          <AccountMenuLinks onSignOut={() => void account.signOut()} />
        </div>
      </details>
    );
  }

  const Icon = accountIcon;
  return (
    <LocalizedAttributes><Link
      href={accountCta.href}
      prefetch={false}
      className={linkClassName}
      aria-label={accountCta.label || "Account"}
      aria-busy={accountCta.ariaBusy || undefined}
    >
      <Icon size={showLabel ? 14 : 18} aria-hidden="true" />
      {showLabel ? (
        <span className="command-bar__account-label">
          <LocalizedText>{accountCta.label || "Account"}</LocalizedText>
        </span>
      ) : null}
    </Link></LocalizedAttributes>
  );
}

function AccountMenuLinks({ onSignOut }: { onSignOut: () => void }) {
  return (
    <>
      <Link href={personalDashboardHref()} prefetch={false}><LocalizedText>{"Il tuo spazio"}</LocalizedText></Link>
      <Link href={workspaceViewHref("salvati")} prefetch={false}><LocalizedText>{"Salvati"}</LocalizedText></Link>
      <Link href={workspaceViewHref("stack")} prefetch={false}><LocalizedText>{"Stack"}</LocalizedText></Link>
      <Link href={workspaceViewHref("decisioni")} prefetch={false}><LocalizedText>{"Decisioni"}</LocalizedText></Link>
      <Link href="/account/settings" prefetch={false}><LocalizedText>{"Impostazioni"}</LocalizedText></Link>
      <button type="button" className="is-destructive" onClick={onSignOut}><LocalizedText>{"Esci"}</LocalizedText></button>
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
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector("a")?.focus();
  }, [open]);

  return (
    <div className={menuClassName}>
      <LocalizedAttributes><button
        ref={buttonRef}
        type="button"
        className={linkClassName}
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${titleId}-panel`}
        aria-busy={busy || undefined}
        onClick={() => {
          if (!open) {
            const rect = buttonRef.current?.getBoundingClientRect();
            if (rect) setBox({ top: rect.bottom + 8, right: Math.max(12, window.innerWidth - rect.right) });
          }
          setOpen((value) => !value);
        }}
      >
        <User size={18} aria-hidden="true" />
      </button></LocalizedAttributes>
      {open && typeof document !== "undefined"
        ? createPortal(
            <>
              <LocalizedAttributes><button type="button" className="td-final-account-scrim" aria-label="Chiudi menu account" onClick={() => setOpen(false)} /></LocalizedAttributes>
              <div
                data-account-menu-panel=""
                ref={panelRef}
                className={panelClassName}
                id={`${titleId}-panel`}
                role="region"
                aria-labelledby={titleId}
                onClick={(event) => {
                  if (event.target instanceof Element && event.target.closest("a, button")) setOpen(false);
                }}
                style={{ top: box.top, right: box.right }}
              >
                <p id={titleId} className="td-final-account-menu__title"><LocalizedText>{"Il tuo spazio"}</LocalizedText></p>
                <AccountMenuLinks onSignOut={() => { setOpen(false); onSignOut(); }} />
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
