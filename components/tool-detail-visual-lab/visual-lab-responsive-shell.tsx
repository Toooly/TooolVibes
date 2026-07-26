import type { ReactNode } from "react";

type VisualLabResponsiveShellProps = {
  children: ReactNode;
};

/**
 * Lab-only responsive shell.
 * Does not replace global marketing shell / footer / command bar.
 * Owns lab-scoped composition breakpoints via .td-lab-shell.
 */
export function VisualLabResponsiveShell({ children }: VisualLabResponsiveShellProps) {
  return (
    <div className="td-lab-shell" data-lab="tool-detail-visual">
      <div className="td-lab-shell__banner" role="note">
        <span className="td-lab-shell__banner-dot" aria-hidden="true" />
        <strong>Tool Detail Visual Lab</strong>
        <span>— esplorazione isolata · produzione intatta · non navigabile in prod</span>
      </div>
      {children}
    </div>
  );
}
