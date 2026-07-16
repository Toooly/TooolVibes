export type PublicToolCutoverVerification = {
  ok: boolean;
  status: "certified" | "blocked";
  summary: {
    directoryPublishedCount: number;
    candidatePublishedCount: number;
    candidateDraftCount: number;
    canonicalMismatchCount: number;
    relatedEdgeCount: number;
    collectionCount: number;
    postCount: number;
  };
  blockers: string[];
};

export function verifyPublicToolCutoverEvidence(
  input: unknown,
): PublicToolCutoverVerification;
