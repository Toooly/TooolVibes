"use client";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { getCanonicalToolWorkspaceState } from "@/lib/stores/tool-workspace-store";

export function useCanonicalWorkspace() {
  useDiscoverySnapshot();
  return getCanonicalToolWorkspaceState();
}
