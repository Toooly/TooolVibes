/* ═══════════════════════════════════════════════════════════════
   Catalog density policy flag (B38 / MOB-702).

   Flag route-level per la variante density del catalogo mobile:
   - una colonna sotto la soglia mobile (contract 320–430px);
   - information priority title → use case → CTA;
   - placement sponsor DOPO il primo valore organico utile.

   Default ON: il sito pubblico resta dietro il gate Coming Soon,
   quindi nessuna variazione visiva pubblica e' attesa. Kill switch:
   NEXT_PUBLIC_TOOOLVIBES_CATALOG_DENSITY_POLICY="0" (o false/off).

   Il flag vive in un modulo dedicato — non in release-features.ts —
   per restare reversibile in modo indipendente dagli altri batch
   (pattern B04, scope ristretto al catalogo).
   ═══════════════════════════════════════════════════════════════ */

export const CATALOG_DENSITY_POLICY_ENV_KEY =
  "NEXT_PUBLIC_TOOOLVIBES_CATALOG_DENSITY_POLICY";

const DISABLED_VALUES = new Set(["0", "false", "off", "disabled"]);

export function parseCatalogDensityPolicyFlag(
  rawValue: string | undefined,
): boolean {
  if (rawValue === undefined) return true;
  return !DISABLED_VALUES.has(rawValue.trim().toLowerCase());
}

export function isCatalogDensityPolicyEnabled(): boolean {
  /* Riferimento diretto alla chiave: Next.js inline-a il valore nei
     bundle client (la result list e' un client component). */
  return parseCatalogDensityPolicyFlag(
    process.env.NEXT_PUBLIC_TOOOLVIBES_CATALOG_DENSITY_POLICY,
  );
}
