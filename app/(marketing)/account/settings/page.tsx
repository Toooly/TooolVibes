import type { Metadata } from "next";
import { AccountSettingsPage } from "@/components/account/account-settings-page";
import "../account.css";

export const metadata: Metadata = {
  title: "Impostazioni account",
  robots: { index: false, follow: false },
};

export default function AccountSettingsRoute() {
  return <AccountSettingsPage />;
}
