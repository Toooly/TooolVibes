import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkspaceQaHarness } from "@/components/account/workspace/workspace-qa-harness";
import type { WorkspaceView } from "@/components/account/workspace/workspace-model";
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
  const fixture = params.state === "new" ? "new" : "mature";
  const view = (params.view ?? "riprendi") as WorkspaceView;
  const surface = params.surface === "settings" ? "settings" : "workspace";

  return (
    <WorkspaceQaHarness fixture={fixture} view={view} surface={surface} />
  );
}
