"use client";

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
}: {
  linkClassName: string;
  menuClassName: string;
  panelClassName: string;
  showLabel?: boolean;
}) {
  const account = useAccount();
  const accountCta = useHeaderAccountCta();
  const accountIcon =
    accountCta.state === "guest" || accountCta.state === "legacy"
      ? UserPlus
      : User;

  if (!accountCta.visible) return null;

  if (accountCta.state === "authenticated" || accountCta.state === "syncing") {
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
          <Link href={personalDashboardHref()} prefetch={false}>
            Il tuo spazio
          </Link>
          <Link href={workspaceViewHref("salvati")} prefetch={false}>
            Salvati
          </Link>
          <Link href={workspaceViewHref("stack")} prefetch={false}>
            Stack
          </Link>
          <Link href={workspaceViewHref("decisioni")} prefetch={false}>
            Decisioni
          </Link>
          <Link href="/account/settings" prefetch={false}>
            Impostazioni
          </Link>
          <button type="button" onClick={() => void account.signOut()}>
            Esci
          </button>
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
