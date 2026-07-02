"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import {
  Sparkles,
  LayoutGrid,
  Radar,
  Heart,
  ShoppingBag,
  Users,
  ArrowUpRight,
  Mail,
} from "lucide-react";

const footerLinks = {
  explore: [
    { label: "Catalogo", href: "/archivio", icon: LayoutGrid },
    { label: "Radar", href: "/radar", icon: Radar },
    { label: "Confronto", href: "/compare", icon: Sparkles },
    { label: "Salvati", href: "/shortlist", icon: Heart },
  ],
  community: [
    { label: "Chi siamo", href: "/chi-siamo", icon: Users },
    { label: "Shop", href: "/shop", icon: ShoppingBag },
    { label: "Community", href: "/community", icon: Users },
    { label: "Blog", href: "/posts", icon: Sparkles },
    { label: "Affiliati", href: "/affiliati", icon: Heart },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Termini", href: "/termini" },
    { label: "Cookie", href: "/cookie" },
  ],
};

function FooterLink({ href, label, icon: Icon }: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 text-sm transition-colors duration-200 text-[#9E99B8] hover:text-[#B388FF]"
      data-sonic-action="nav"
    >
      {Icon && (
        <Icon
          size={14}
          className="text-[#B388FF]/60 opacity-70 transition-opacity group-hover:opacity-100"
        />
      )}
      <span>{label}</span>
      <ArrowUpRight
        size={12}
        className="opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0"
      />
    </Link>
  );
}

export function SiteFooterV2() {
  return (
    <footer className="site-footer-v2 relative mt-auto border-t border-[rgba(124,77,255,0.08)] bg-[#06060E]">
      <div className="relative mx-auto max-w-[1440px] px-6 py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="group mb-5 inline-flex items-center gap-3">
              <div className="transition-transform duration-300 group-hover:scale-105">
                <BrandLogo size={40} fallback="png" priority />
              </div>
              <span
                className="text-xl font-bold tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #6a3cff 0%, #39d2f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                TOOOLVIBES
              </span>
            </Link>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-[#9E99B8]">
              Il sistema per scoprire tool AI, SaaS, no-code e vibe coding.
              Trova, confronta e costruisci la lista giusta per te.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Mail, href: "mailto:hello@tooolvibes.com", label: "Email" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(124,77,255,0.15)] bg-[rgba(124,77,255,0.08)] text-[#B388FF] transition-all hover:border-[rgba(124,77,255,0.3)] hover:bg-[rgba(124,77,255,0.15)] hover:text-white hover:shadow-[0_0_16px_rgba(124,77,255,0.2)]"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B388FF]">Esplora</h3>
            <div className="flex flex-col gap-2.5">
              {footerLinks.explore.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B388FF]">Community</h3>
            <div className="flex flex-col gap-2.5">
              {footerLinks.community.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B388FF]">Resta aggiornato</h3>
            <p className="mb-4 text-sm text-[#9E99B8]">
              La newsletter non è ancora attiva. Per aggiornamenti o segnalazioni, scrivici direttamente.
            </p>
            <a
              href="mailto:hello@tooolvibes.com"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(124,77,255,0.15)] bg-[rgba(124,77,255,0.08)] px-4 py-2.5 text-sm font-medium text-[#B388FF] transition-all hover:border-[rgba(124,77,255,0.3)] hover:bg-[rgba(124,77,255,0.15)] hover:text-white hover:shadow-[0_0_16px_rgba(124,77,255,0.15)]"
            >
              <Mail size={16} />
              Scrivici
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[rgba(124,77,255,0.08)] pt-8 md:flex-row">
          <p className="text-xs text-[#9E99B8]">
            &copy; {new Date().getFullYear()} TooolVibes. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-[#9E99B8]/80 hover:text-[#B388FF] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
