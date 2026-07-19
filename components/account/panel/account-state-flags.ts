/* ═══════════════════════════════════════════════════════════════
   Account state matrix — feature flag (B59 / STATE-1002).
   Pattern B04: kill switch via env con default ON. Modulo locale
   al batch (non lib/config/release-features.ts, condiviso con
   altri agenti): NEXT_PUBLIC_TOOOLVIBES_ACCOUNT_STATE_MATRIX=0
   ripristina il comportamento precedente senza revert di codice.
   Accesso statico a process.env per l'inlining Next client-side;
   in vitest la lettura resta dinamica (flag commutabile per test).
   ═══════════════════════════════════════════════════════════════ */

const OFF_VALUES = new Set(["0", "false", "off", "no"]);

export function isAccountStateMatrixEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_TOOOLVIBES_ACCOUNT_STATE_MATRIX;
  if (raw === undefined || raw.trim() === "") {
    return true;
  }
  return !OFF_VALUES.has(raw.trim().toLowerCase());
}
