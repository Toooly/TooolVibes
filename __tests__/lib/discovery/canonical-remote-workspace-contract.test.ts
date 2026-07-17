import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(
  process.cwd(),
  "lib/discovery/canonical-remote-workspace.ts",
), "utf8");

describe("canonical remote workspace ownership contract", () => {
  it("claims a guest profile with an ownership-guarded compare-and-set", () => {
    const start = source.indexOf("async function assignViewer");
    const end = source.indexOf("function revisionOf", start);
    const assignViewer = source.slice(start, end);

    expect(assignViewer).toContain('.eq("id", viewerId)');
    expect(assignViewer).toContain('.eq("kind", "guest")');
    expect(assignViewer).toContain('.is("auth_user_id", null)');
    expect(assignViewer).toContain(".maybeSingle()");
    expect(assignViewer).toContain("return viewerForUser(userId)");
  });

  it("preserves an unconsumed legacy remote guest when the account already exists", () => {
    const start = source.indexOf("export async function attachCanonicalWorkspace");
    const end = source.indexOf("export async function releaseCanonicalWorkspace", start);
    const attach = source.slice(start, end);
    const accountBranchStart = attach.indexOf("if (account)");
    const accountBranchEnd = attach.indexOf(
      '} else if (current?.kind === "guest")',
      accountBranchStart,
    );
    const accountBranch = attach.slice(accountBranchStart, accountBranchEnd);

    expect(accountBranch).not.toContain("repository(current.id).load()");
    expect(accountBranch).not.toContain("mergeGuestWorkspaceContribution");
    expect(attach).toContain("const guestContribution = guestState");
    expect(accountBranch).toContain(
      "Keep the legacy guest row untouched",
    );
    expect(attach).not.toContain("consumedGuestId");
    expect(attach).not.toContain(".delete()");
  });

  it("creates an isolated account if another request wins the guest claim", () => {
    const start = source.indexOf("export async function attachCanonicalWorkspace");
    const end = source.indexOf("export async function releaseCanonicalWorkspace", start);
    const attach = source.slice(start, end);

    expect(attach).toContain(
      "await assignViewer(current.id, userId) ?? await createAccount(userId)",
    );
  });
});
