"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { ArrowUpRight, Mail } from "lucide-react";

import { useNavItems } from "@/lib/navigation/navigation-release-context";
import { getNavDestination } from "@/lib/navigation/selectors";

const contactEmailDestination = getNavDestination("contact-email");

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
  const exploreLinks = useNavItems("footer-v2-explore");
  const communityLinks = useNavItems("footer-v2-community");
  const legalLinks = useNavItems("footer-v2-legal");
  const socialLinks = useNavItems("footer-v2-social");
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
              {socialLinks.map((social) => {
                const SocialIcon = social.icon;
                return (
                  <a
                    key={social.id}
                    href={social.href}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(124,77,255,0.15)] bg-[rgba(124,77,255,0.08)] text-[#B388FF] transition-all hover:border-[rgba(124,77,255,0.3)] hover:bg-[rgba(124,77,255,0.15)] hover:text-white hover:shadow-[0_0_16px_rgba(124,77,255,0.2)]"
                    aria-label={social.label}
                  >
                    {SocialIcon ? <SocialIcon size={18} /> : null}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B388FF]">Esplora</h3>
            <div className="flex flex-col gap-2.5">
              {exploreLinks.map((link) => (
                <FooterLink
                  key={link.id}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B388FF]">Community</h3>
            <div className="flex flex-col gap-2.5">
              {communityLinks.map((link) => (
                <FooterLink
                  key={link.id}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B388FF]">Resta aggiornato</h3>
            <p className="mb-4 text-sm text-[#9E99B8]">
              La newsletter non è ancora attiva. Per aggiornamenti o segnalazioni, scrivici direttamente.
            </p>
            <a
              href={contactEmailDestination.href}
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
            {legalLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="text-xs text-[#9E99B8]/80 hover:text-[#B388FF] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="site-footer-v2__disclosure mt-5 border-t border-[rgba(124,77,255,0.08)] pt-5">
          Alcuni link possono essere affiliate: se acquisti tramite quei collegamenti, TooolVibes
          potrebbe ricevere una commissione senza costi extra per te.
        </p>
      </div>
    </footer>
  );
}
