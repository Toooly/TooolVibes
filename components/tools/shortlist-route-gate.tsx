"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { navigateSite } from "@/lib/shell/document-navigation";

import { useAccount } from "@/components/account/account-provider";
import { workspaceViewHref } from "@/components/account/workspace/workspace-model";

export function ShortlistRouteGate({ children }: { children: ReactNode }) {
  const account = useAccount();
  const router = useRouter();
  const authenticated = account.status === "authenticated";

  useEffect(() => {
    if (authenticated) {
      navigateSite(workspaceViewHref("salvati"), router, true);
    }
  }, [authenticated, router]);

  if (authenticated) {
    return <p><LocalizedText>{"Apertura Salvati…"}</LocalizedText></p>;
  }

  return children;
}
