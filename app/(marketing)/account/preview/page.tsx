import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkspaceQaHarness } from "@/components/account/workspace/workspace-qa-harness";
import { parseWorkspaceView } from "@/components/account/workspace/workspace-model";
import "@/app/(marketing)/account/account.css";

export const metadata: Metadata = {
  title: "Workspace shell preview",
  robots: { index: false, follow: false },
};

export default async function WorkspaceShellPreviewPage({
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
  const surface = params.surface === "settings" ? "settings" : "workspace";

  return <WorkspaceQaHarness fixture={fixture} view={view} surface={surface} />;
}
