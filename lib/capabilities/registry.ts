export type CapabilityAccess = "public" | "guest-local" | "authenticated";

export type ViewerKind = "guest" | "authenticated";

export const CAPABILITY_IDS = [
  "catalog.browse",
  "tool.page.public",
  "search.basic",
  "radar.public",
  "alternatives.basic",
  "collections.editorial.read",
  "compare.basic",
  "save.local",
  "decide.fast",
  "note.local",
  "usage.local",
  "workspace.cloud",
  "stack.create",
  "stack.edit",
  "filo.read",
  "review.queue",
  "note.private",
  "search.personal",
  "compare.deep",
  "insight.personal",
  "radar.personal",
  "community.write",
  "community.read",
  "workspace.export",
] as const;

export type CapabilityId = (typeof CAPABILITY_IDS)[number];

export type CapabilityDefinition = {
  id: CapabilityId;
  access: CapabilityAccess;
  reason: string;
  authPromptKey: string | null;
  fallback: string;
  continuation: boolean;
  telemetryKey: string | null;
  serverEnforced: string;
};

const PUBLIC = "public" as const;
const GUEST_LOCAL = "guest-local" as const;
const AUTH = "authenticated" as const;

const REGISTRY: Record<CapabilityId, CapabilityDefinition> = {
  "catalog.browse": {
    id: "catalog.browse",
    access: PUBLIC,
    reason: "Discovery does not need identity",
    authPromptKey: null,
    fallback: "catalog",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "none",
  },
  "tool.page.public": {
    id: "tool.page.public",
    access: PUBLIC,
    reason: "SEO / understand",
    authPromptKey: null,
    fallback: "tool page",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "none",
  },
  "search.basic": {
    id: "search.basic",
    access: PUBLIC,
    reason: "Public catalog query",
    authPromptKey: null,
    fallback: "catalog search",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "none",
  },
  "radar.public": {
    id: "radar.public",
    access: PUBLIC,
    reason: "Public signal",
    authPromptKey: null,
    fallback: "/radar",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "none",
  },
  "alternatives.basic": {
    id: "alternatives.basic",
    access: PUBLIC,
    reason: "Catalog fact",
    authPromptKey: null,
    fallback: "alternatives table",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "none",
  },
  "collections.editorial.read": {
    id: "collections.editorial.read",
    access: PUBLIC,
    reason: "Editorial stacks",
    authPromptKey: null,
    fallback: "/collections",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "public read",
  },
  "compare.basic": {
    id: "compare.basic",
    access: PUBLIC,
    reason: "Discovery compare does not need identity",
    authPromptKey: null,
    fallback: "/compare",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "none",
  },
  "save.local": {
    id: "save.local",
    access: GUEST_LOCAL,
    reason: "Cheap capture",
    authPromptKey: null,
    fallback: "Speed 1",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "none on local write",
  },
  "decide.fast": {
    id: "decide.fast",
    access: GUEST_LOCAL,
    reason: "Judgment is not identity",
    authPromptKey: null,
    fallback: "DecisionSheet",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "none on local write",
  },
  "note.local": {
    id: "note.local",
    access: GUEST_LOCAL,
    reason: "On-device scratch",
    authPromptKey: null,
    fallback: "/shortlist note",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "none",
  },
  "usage.local": {
    id: "usage.local",
    access: GUEST_LOCAL,
    reason: "Same as decide",
    authPromptKey: null,
    fallback: "boards",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "none",
  },
  "workspace.cloud": {
    id: "workspace.cloud",
    access: AUTH,
    reason: "Cross-device persistence",
    authPromptKey: null,
    fallback: "local-only",
    continuation: false,
    telemetryKey: "workspace.cloud",
    serverEnforced: "Bearer PUT/attach/release",
  },
  "stack.create": {
    id: "stack.create",
    access: AUTH,
    reason: "Persistent working set needs identity",
    authPromptKey: "stack.create",
    fallback: "AuthSheet",
    continuation: true,
    telemetryKey: "stack.create",
    serverEnforced: "workspace blob CAS; UI is not authorization",
  },
  "stack.edit": {
    id: "stack.edit",
    access: AUTH,
    reason: "Ownership",
    authPromptKey: "stack.create",
    fallback: "none",
    continuation: false,
    telemetryKey: "stack.edit",
    serverEnforced: "workspace blob CAS",
  },
  "filo.read": {
    id: "filo.read",
    access: AUTH,
    reason: "Time room",
    authPromptKey: null,
    fallback: "none",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "workspace blob CAS",
  },
  "review.queue": {
    id: "review.queue",
    access: AUTH,
    reason: "Remember over time",
    authPromptKey: null,
    fallback: "none",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "workspace blob CAS",
  },
  "note.private": {
    id: "note.private",
    access: AUTH,
    reason: "Personal memory",
    authPromptKey: "note.private",
    fallback: "guest scratch on /shortlist",
    continuation: true,
    telemetryKey: "note.private",
    serverEnforced: "workspace blob CAS",
  },
  "search.personal": {
    id: "search.personal",
    access: AUTH,
    reason: "Personal corpus",
    authPromptKey: "search.personal",
    fallback: "search.basic",
    continuation: true,
    telemetryKey: "search.personal",
    serverEnforced: "client-side; no search API V1",
  },
  "compare.deep": {
    id: "compare.deep",
    access: AUTH,
    reason: "Personal context",
    authPromptKey: "compare.deep",
    fallback: "compare.basic",
    continuation: true,
    telemetryKey: "compare.deep",
    serverEnforced: "none extra",
  },
  "insight.personal": {
    id: "insight.personal",
    access: AUTH,
    reason: "Derived from workspace",
    authPromptKey: "insight.personal",
    fallback: "editorial insight",
    continuation: true,
    telemetryKey: "insight.personal",
    serverEnforced: "client-side",
  },
  "radar.personal": {
    id: "radar.personal",
    access: AUTH,
    reason: "PH intersect workspace",
    authPromptKey: "insight.personal",
    fallback: "radar.public",
    continuation: true,
    telemetryKey: "radar.personal",
    serverEnforced: "client-side",
  },
  "community.write": {
    id: "community.write",
    access: AUTH,
    reason: "Identity and moderation",
    authPromptKey: "community.write",
    fallback: "community.read",
    continuation: true,
    telemetryKey: "community.write",
    serverEnforced: "Bearer + pending-first + RLS",
  },
  "community.read": {
    id: "community.read",
    access: PUBLIC,
    reason: "Published experiences (future)",
    authPromptKey: null,
    fallback: "none",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "published-only select — Wave H",
  },
  "workspace.export": {
    id: "workspace.export",
    access: AUTH,
    reason: "Vault ownership",
    authPromptKey: null,
    fallback: "AuthPage",
    continuation: false,
    telemetryKey: null,
    serverEnforced: "session",
  },
};

export function getCapability(
  capability: string,
): CapabilityDefinition | null {
  if ((CAPABILITY_IDS as readonly string[]).includes(capability)) {
    return REGISTRY[capability as CapabilityId];
  }
  return null;
}

export function canUse(
  capability: string,
  viewer: ViewerKind,
): boolean {
  const definition = getCapability(capability);
  if (!definition) {
    return false;
  }
  if (
    definition.access === "public" ||
    definition.access === "guest-local"
  ) {
    return true;
  }
  return viewer === "authenticated";
}

export function listCapabilities(): readonly CapabilityDefinition[] {
  return CAPABILITY_IDS.map((id) => REGISTRY[id]);
}
