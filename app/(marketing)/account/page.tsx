import type { Metadata } from "next";

import { AccountPanel } from "@/components/account/account-panel";

export const metadata: Metadata = {
  title: "Account",
  description: "Gestisci accesso e salvataggi personali su TooolVibes.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="tone-account page-shell space-y-6 pb-18 pt-8 sm:space-y-8 sm:pb-22 sm:pt-10">
      <AccountPanel />
    </div>
  );
}
