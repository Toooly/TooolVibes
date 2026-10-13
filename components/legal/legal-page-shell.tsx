import type { ReactNode } from "react";
import Link from "@/components/ui/app-link";
import { ArrowUpRight } from "lucide-react";

import { RouteMarker } from "@/components/ui/route-marker";

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/termini", label: "Termini" },
  { href: "/cookie", label: "Cookie" },
];

type LegalPageShellProps = {
  index: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalPageShell({
  index,
  title,
  description,
  children,
}: LegalPageShellProps) {
  return (
    <article className="legal-page page-shell">
      <RouteMarker
        index={index}
        label="Documenti TooolVibes"
        status="Informazioni essenziali"
        density="minimal"
      />

      <div className="legal-page__layout">
        <header className="legal-page__intro">
          <p className="editorial-label">Trasparenza di prodotto</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>

        <div className="legal-page__body">{children}</div>
      </div>

      <nav className="legal-page__nav" aria-label="Documenti legali">
        {legalLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.label === title ? "page" : undefined}
          >
            <ArrowUpRight aria-hidden="true" />
            {link.label}
          </Link>
        ))}
      </nav>
    </article>
  );
}
