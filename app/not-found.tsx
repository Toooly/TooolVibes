import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";

export default function NotFound() {
  return (
    <div className="page-shell py-16 sm:py-24">
      <div className="brand-panel brand-aura rounded-[var(--radius-xl)] p-8 text-center sm:p-12">
        <div className="flex justify-center">
          <BrandLogo size={88} priority />
        </div>
        <p className="pill">404</p>
        <h1 className="mt-5 text-4xl sm:text-5xl">Questa pagina non e` disponibile.</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7" style={{ color: "var(--muted)" }}>
          Il contenuto che stai cercando non e` stato trovato oppure non e` ancora pubblicato.
        </p>
        <Link
          href="/"
          className="button-shell button-primary text-ui-strong mt-8 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white"
        >
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
