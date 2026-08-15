"use client";

import Link from "next/link";

import { useAccount } from "@/components/account/account-provider";
import { AccountAccessSection } from "./panel/account-access-section";
import { AccountPreferencesSection } from "./panel/account-preferences-section";
import { AccountRecoverySection } from "./panel/account-recovery-section";
import { AccountStatusSection } from "./panel/account-status-section";
import { useAccountSignupForm } from "./panel/use-account-signup-form";
import { useAccountVibeContext } from "./panel/use-account-vibe-context";
import { useAccountWorkspaceSummary } from "./panel/use-account-workspace-summary";
import { AuthPage } from "./auth-page";

export function AccountSettingsPage() {
  const account = useAccount();
  const { vibeContext } = useAccountVibeContext();
  const signupForm = useAccountSignupForm({
    sendMagicLink: account.sendMagicLink,
    vibeContext,
  });
  const { workspace } = useAccountWorkspaceSummary();

  if (account.status === "loading") {
    return <p className="px-4 py-8">Apertura impostazioni…</p>;
  }
  if (account.status !== "authenticated") {
    return <AuthPage />;
  }

  return (
    <div id="member-access" className="tone-account relative z-10 space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <p><Link className="account-link" href="/account">← My TooolVibes</Link></p>
      <h1 className="account-title">Impostazioni</h1>
      <AccountStatusSection account={account} />
      <AccountPreferencesSection status={account.status} savedCount={workspace.saved} />
      <AccountAccessSection account={account} form={signupForm} />
      <AccountRecoverySection account={account} />
    </div>
  );
}
