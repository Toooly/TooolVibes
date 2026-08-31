"use client";

import { useEffect } from "react";
import { useAccount } from "./account-provider";
import { ScenicLoading } from "@/components/layout/scenic-loading";
import { AuthPage } from "./auth-page";
import { AccountPanel } from "./account-panel";

export function AccountGate() {
  const account = useAccount();
  useEffect(() => {
    document.body.dataset.accountSurface = account.status === "authenticated" ? "workspace" : "auth";
    return () => {
      delete document.body.dataset.accountSurface;
    };
  }, [account.status]);

  if (account.status === "loading") {
    return (
      <div id="member-access" className="v-auth-page v-auth-page--loading scroll-mt-24" data-state="loading">
        <ScenicLoading label="Apriamo il tuo spazio" />
      </div>
    );
  }

  if (account.status === "authenticated") {
    return <AccountPanel />;
  }

  return <AuthPage />;
}
