export const PUBLIC_TOOL_RELEASE_FINGERPRINT_VERSION:
  "tool-public-release-semantics-v1";

export type PublicToolCutoverInventory = {
  fingerprintVersion: "tool-public-release-semantics-v1";
  published: Array<{ slug: string; fingerprint: string }>;
  draftSlugs: string[];
};

export function fingerprintToolPublicReleaseSemantics(tool: unknown): string;
export function buildPublicToolCutoverInventory(
  input: unknown,
): PublicToolCutoverInventory;
