"use client";

/**
 * Lightweight CSS gradient background for the account area.
 * Replaced the previous canvas-based particle system to keep
 * unauthenticated rendering lightweight.
 */
export function AccountVibesBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        background: "linear-gradient(180deg, #06060E 0%, #0A0A18 40%, #12122A 100%)",
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
