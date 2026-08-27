"use client";

import { useAccount } from "@/components/account/account-provider";
import { WorkspaceShell } from "@/components/account/workspace/workspace-shell";

export function AccountPanel() {
  const account = useAccount();

  if (account.status === "authenticated") {
    return <WorkspaceShell />;
  }

  return null;
}
