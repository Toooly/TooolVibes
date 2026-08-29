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
                    : "workspace";

  return (
    <WorkspaceQaHarness fixture={fixture} view={view} surface={surface} />
  );
}
