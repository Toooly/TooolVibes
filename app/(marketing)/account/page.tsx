import type { Metadata } from "next";

import { Account3DPortal } from "@/components/3d-maestoso/account-3d-portal";
import { AccountPanel } from "@/components/account/account-panel";

export const metadata: Metadata = {
  title: "Account",
  description: "Gestisci accesso e salvataggi personali su TooolVibes.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Account3DPortal>
      <AccountPanel />
    </Account3DPortal>
  );
}
