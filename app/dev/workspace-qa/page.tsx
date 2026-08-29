import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkspaceQaHarness } from "@/components/account/workspace/workspace-qa-harness";
import { parseWorkspaceView } from "@/components/account/workspace/workspace-model";
import "@/app/(marketing)/account/account.css";

export const metadata: Metadata = {
  title: "Workspace QA",
  robots: { index: false, follow: false },
};

export default async function WorkspaceQaPage({
  searchParams,
}: {
  searchParams: Promise<{
    state?: string;
    view?: string;
    surface?: string;
  }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const allowed = [
    "new",
    "quiet",
    "review",
    "compare",
    "stacks",
    "resume",
    "few",
    "using",
    "empty",
    "multistack",
    "mature",
  ] as const;
  const fixture = allowed.includes(params.state as (typeof allowed)[number])
    ? (params.state as (typeof allowed)[number])
    : "mature";
  const view = parseWorkspaceView(params.view);
  const surface =
    params.surface === "settings"
      ? "settings"
      : params.surface === "auth-sheet"
        ? "auth-sheet"
        : params.surface === "auth-sheet-note"
          ? "auth-sheet-note"
          : params.surface === "legacy-stack"
            ? "legacy-stack"
            : params.surface === "private-note"
              ? "private-note"
              : params.surface === "private-note-guest"
                ? "private-note-guest"
                : params.surface === "personal-search"
                  ? "personal-search"
                  : params.surface === "personal-search-guest"
                    ? "personal-search-guest"
                    : params.surface === "deep-compare"
                      ? "deep-compare"
                      : params.surface === "deep-compare-guest"
                        ? "deep-compare-guest"
                      : params.surface === "auth-sheet-insight"
                        ? "auth-sheet-insight"
                      : params.surface === "personal-insights"
                        ? "personal-insights"
                      : params.surface === "auth-sheet-radar"
                        ? "auth-sheet-radar"
                      : params.surface === "radar-personal"
                        ? "radar-personal"
                      : params.surface === "radar-personal-guest"
                        ? "radar-personal-guest"
                      : params.surface === "personal-insights-guest"
                        ? "personal-insights-guest"
                      : params.surface === "community-experiences"
                        ? "community-experiences"
                    : "workspace";

  return (
    <WorkspaceQaHarness fixture={fixture} view={view} surface={surface} />
  );
}
