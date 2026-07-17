export const DISCOVERY_SYNC_EVENT = "tooolvibes:discovery-sync";

export type WorkspaceChangeSource = "cross-tab" | "local" | "remote";
export type WorkspaceChangeScope = "telemetry" | "workspace";

export type WorkspaceChangeEventDetail = {
  source: WorkspaceChangeSource;
  scope: WorkspaceChangeScope;
};

export function dispatchWorkspaceChange(
  detail: WorkspaceChangeEventDetail,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<WorkspaceChangeEventDetail>(DISCOVERY_SYNC_EVENT, {
      detail,
    }),
  );
}

export function readWorkspaceChangeDetail(
  event: Event,
): WorkspaceChangeEventDetail | null {
  if (!(event instanceof CustomEvent)) {
    return null;
  }

  const detail = event.detail as Partial<WorkspaceChangeEventDetail> | null;
  const validSource =
    detail?.source === "cross-tab" ||
    detail?.source === "local" ||
    detail?.source === "remote";
  const validScope =
    detail?.scope === "telemetry" || detail?.scope === "workspace";

  return validSource && validScope
    ? { source: detail.source!, scope: detail.scope! }
    : null;
}
