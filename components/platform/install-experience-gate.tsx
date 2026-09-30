"use client";

/**
 * Engagement-aware gate for the install sheet.
 * Shows at most once per session, only after meaningful engagement:
 * saved >= 1, or compare >= 1, or >= 3 sessions.
 */

import { useEffect, useState } from "react";

import { InstallExperience } from "./install-experience";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

const SESSION_KEY = "tooolvibes:sessions:v1";

export function InstallExperienceGate() {
  const [engaged, setEngaged] = useState(false);
  const saved = useToolWorkspaceStore((s) => s.savedSlugs.length);
  const compared = useToolWorkspaceStore((s) => s.compareSlugs.length);

  useEffect(() => {
    let sessions = 0;
    try {
      sessions = Number(sessionStorage.getItem(SESSION_KEY) ?? 0) + 1;
      sessionStorage.setItem(SESSION_KEY, String(sessions));
    } catch {
      sessions = 1;
    }
    if (saved >= 1 || compared >= 1 || sessions >= 3) setEngaged(true);
  }, [saved, compared]);

  return <InstallExperience engaged={engaged} />;
}
