"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import { ScenicLoading } from "@/components/layout/scenic-loading";

import { useAccount } from "./account-provider";

export function MemberPreviewGate({
  children,
  kicker = "Spazio personale",
  title = "Continua nel tuo spazio",
  body = "Accedi per leggere il contenuto completo.",
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
        <p className="tv-member-gate__kicker"><LocalizedText>{kicker}</LocalizedText></p>
        <h2 id="tv-member-gate-title" className="tv-member-gate__title">
          <LocalizedText>{title}</LocalizedText>
        </h2>
        <p className="tv-member-gate__body"><LocalizedText>{body}</LocalizedText></p>
        <Link className="tv-member-gate__cta" href="/account"><LocalizedText>{"Accedi"}</LocalizedText></Link>
      </div>
      <div className="tv-member-gate__locked" inert aria-hidden="true">
        {children}
      </div>
    </section>
  );
}
