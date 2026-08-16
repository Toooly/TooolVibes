"use client";

import Link from "next/link";

import { useAccount } from "@/components/account/account-provider";
import { AccountRecoverySection } from "./panel/account-recovery-section";
import { AccountSubmissionsSection } from "./panel/account-submissions-section";
import { useAccountSubmissions } from "./panel/use-account-submissions";
import { AuthPage } from "./auth-page";

export function AccountSettingsPage() {
  const account = useAccount();
  const submissions = useAccountSubmissions({
    status: account.status,
    accessToken: account.session?.access_token,
  });

  if (account.status === "loading") {
    return <p className="px-4 py-8">Apertura impostazioni…</p>;
  }
  if (account.status !== "authenticated") {
    return <AuthPage />;
  }

  return (
    <div id="member-access" className="tone-account relative z-10 space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <p>
        <Link className="account-link" href="/account">
          ← My TooolVibes
        </Link>
      </p>
      <header className="account-hero account-hero--session p-5 sm:p-6">
        <p className="account-label">Account</p>
        <h1 className="account-title mt-2">Impostazioni</h1>
        <p className="account-subtitle mt-2">{account.user?.email ?? "Account attivo"}</p>
        <button
          type="button"
          onClick={() => void account.signOut()}
          className="account-btn-secondary mt-4"
        >
          Esci dall&apos;account
        </button>
      </header>
      <AccountRecoverySection account={account} />
      <AccountSubmissionsSection
        status={account.status}
        submissions={submissions.submissions}
        isLoading={submissions.isLoading}
        totalSubmissions={submissions.totalSubmissions}
        error={submissions.error}
        onRetry={submissions.reload}
      />
    </div>
  );
}
