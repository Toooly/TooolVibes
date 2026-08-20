import type { WorkspaceStateV1 } from "@/lib/discovery/types";

export const WORKSPACE_EXPORT_PRODUCT = "tooolvibes-workspace";
export const WORKSPACE_EXPORT_SCHEMA_VERSION = 1;
export const WORKSPACE_RESET_CONFIRMATION = "RESET";

export type WorkspaceExportPayload = {
  exportedAt: string;
  product: typeof WORKSPACE_EXPORT_PRODUCT;
  schemaVersion: typeof WORKSPACE_EXPORT_SCHEMA_VERSION;
  state: WorkspaceStateV1;
};

export function buildWorkspaceExportPayload(
  state: WorkspaceStateV1,
  exportedAt: Date = new Date(),
): WorkspaceExportPayload {
  return {
    exportedAt: exportedAt.toISOString(),
    product: WORKSPACE_EXPORT_PRODUCT,
    schemaVersion: WORKSPACE_EXPORT_SCHEMA_VERSION,
    state,
  };
}

export function workspaceExportFilename(date: Date = new Date()) {
  return `tooolvibes-workspace-${date.toISOString().slice(0, 10)}.json`;
}

export function isWorkspaceResetConfirmed(value: string) {
  return value === WORKSPACE_RESET_CONFIRMATION;
}

export function downloadWorkspaceExportJson(
  payload: WorkspaceExportPayload,
  filename: string,
) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
