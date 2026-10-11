"use client";

import Link from "next/link";

import { ScenicLoading } from "@/components/layout/scenic-loading";

import { useAccount } from "./account-provider";

/**
 * Strict logged-only gate for expensive member surfaces (FULL Radar).
 *
 * DIFFERENCE vs `MemberPreviewGate`: children are NOT rendered for guests at
 * all — not even `inert`. This is required by the Radar auth contract:
 *
 *   - no flash of the complete logged-only Radar before auth resolves
 *   - no guest render → giant Radar → login gate
 *   - no data fetch for logged-only work until auth access is known
 *
 * Authorization is still owned server-side (Supabase session / verified
 * tokens). This component is the presentation gate that prevents leaking the
 * locked surface into guest HTML. No presentation cookie ever grants access.
 */
export function MemberOnlyGate({
  children,
  kicker = "Contenuto riservato",
  title = "Accedi per continuare",
  body = "Questo spazio è disponibile solo agli account autenticati.",
}: {
  children: React.ReactNode;
  kicker?: string;
  title?: string;
  body?: string;
}) {
  const account = useAccount();

  if (account.status === "loading") {
    return <ScenicLoading compact label="Apertura del contenuto" />;
  }

  if (account.status === "authenticated") {
    return <>{children}</>;
  }

  return (
    <section className="tv-member-gate" aria-labelledby="tv-member-only-gate-title">
      <div className="tv-member-gate__card">
        <p className="tv-member-gate__kicker">{kicker}</p>
        <h1 id="tv-member-only-gate-title" className="tv-member-gate__title">
          {title}
        </h1>
        <p className="tv-member-gate__body">{body}</p>
        <Link className="tv-member-gate__cta" href="/account">
          Entra per continuare
        </Link>
      </div>
    </section>
  );
}
