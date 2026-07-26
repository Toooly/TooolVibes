import type { Metadata } from "next";
import { AccountGate } from "@/components/account/account-gate";
import "./account.css";

export const metadata: Metadata = {
  title: "Account — TooolVibes",
  description: "Accedi, registrati o gestisci il tuo account su TooolVibes.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountGate />;
}
