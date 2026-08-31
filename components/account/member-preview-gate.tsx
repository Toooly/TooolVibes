"use client";

import Link from "next/link";

import { ScenicLoading } from "@/components/layout/scenic-loading";

import { useAccount } from "./account-provider";

export function MemberPreviewGate({
  children,
  kicker = "Spazio personale",
  title = "Registrati per proseguire",
  body = "Raccolte complete, guide profonde e la memoria delle tue decisioni restano nel tuo spazio.",
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
    <section className="tv-member-gate" aria-labelledby="tv-member-gate-title">
      <div className="tv-member-gate__card">
        <p className="tv-member-gate__kicker">{kicker}</p>
        <h2 id="tv-member-gate-title" className="tv-member-gate__title">
          {title}
        </h2>
        <p className="tv-member-gate__body">{body}</p>
        <Link className="tv-member-gate__cta" href="/account">
          Crea il tuo spazio
        </Link>
      </div>
      <div className="tv-member-gate__locked" inert aria-hidden="true">
        {children}
      </div>
    </section>
  );
}
