"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Globe,
  Code2,
} from "lucide-react";

const footerLinks = {
  explore: [
    { label: "Catalogo", href: "/archivio", icon: LayoutGrid },
    { label: "Radar", href: "/product-hunt", icon: Radar },
    { label: "Compare", href: "/compare", icon: Sparkles },
    { label: "Wishlist", href: "/wishlist", icon: Heart },
  ],
  community: [
    { label: "Shop", href: "/shop", icon: ShoppingBag },
    { label: "Community", href: "/community", icon: Users },
    { label: "Blog", href: "/posts", icon: Sparkles },
    { label: "Affiliati", href: "/affiliati", icon: Heart },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Termini", href: "/terms" },
    { label: "Cookie", href: "/cookies" },
  ],
};

type FooterLinkProps = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  light?: boolean;
};

function FooterLink({ href, label, icon: Icon, light = false }: FooterLinkProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-2 text-sm transition-colors duration-200 ${
        light ? "text-[#f5f0ff] hover:text-white" : "text-[#4f4970] hover:text-[#6a3cff]"
      }`}
      data-sonic-action="nav"
    >
      {Icon && (
        <Icon
          size={14}
          className={`opacity-50 transition-opacity group-hover:opacity-100 ${
            light ? "text-[#ff7ac8]" : "text-[#6a3cff]"
          }`}
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
  const pathname = usePathname();
  const darkFooter =
    pathname?.startsWith("/product-hunt") ||
    pathname?.startsWith("/shortlist") ||
    pathname?.startsWith("/compare");

  const headingClass = darkFooter
    ? "mb-4 text-xs font-semibold uppercase tracking-widest text-violet-100"
    : "mb-4 text-xs font-semibold uppercase tracking-widest text-[#2d255d]";

  return (
    <footer
      className={`relative mt-auto border-t ${
        darkFooter
          ? "site-footer-v2--dark border-white/10 bg-[#080411]"
          : "border-[rgba(106,60,255,0.08)]"
      }`}
    >
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
            <p
              className={`mb-5 max-w-xs text-sm leading-relaxed ${
                darkFooter ? "text-[#eee8ff]" : "text-[#4f4970]"
              }`}
            >
              Il sistema di discovery per tool AI, SaaS, no-code e vibe coding.
              Trova, confronta e costruisci il tuo stack perfetto.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Code2, href: "#", label: "Twitter" },
                { icon: Globe, href: "#", label: "GitHub" },
                { icon: Mail, href: "mailto:hello@tooolvibes.com", label: "Email" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                    darkFooter
                      ? "border-[#ff7ac8]/35 bg-[#ff5eb8]/14 text-[#ffd8ef] shadow-[0_0_22px_rgba(255,94,184,0.12)] hover:border-[#ff9bd8] hover:bg-[#ff5eb8]/24 hover:text-white"
                      : "border-[rgba(106,60,255,0.1)] bg-[rgba(255,255,255,0.5)] text-[#4f4970] hover:border-[#6a3cff] hover:bg-[rgba(106,60,255,0.05)] hover:text-[#6a3cff]"
                  }`}
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className={headingClass}>Esplora</h3>
            <div className="flex flex-col gap-2.5">
              {footerLinks.explore.map((link) => (
                <FooterLink key={link.label} {...link} light={darkFooter} />
              ))}
            </div>
          </div>

          <div>
            <h3 className={headingClass}>Community</h3>
            <div className="flex flex-col gap-2.5">
              {footerLinks.community.map((link) => (
                <FooterLink key={link.label} {...link} light={darkFooter} />
              ))}
            </div>
          </div>

          <div>
            <h3 className={headingClass}>Resta aggiornato</h3>
            <p className={`mb-4 text-sm ${darkFooter ? "text-[#eee8ff]" : "text-[#4f4970]"}`}>
              Ricevi ogni settimana i tool AI piu innovativi direttamente nella tua inbox.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <input
                type="email"
                placeholder="la tua email"
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-[#6a3cff] focus:ring-2 focus:ring-[rgba(106,60,255,0.1)] ${
                  darkFooter
                    ? "border-white/[0.18] bg-white/[0.1] text-white placeholder:text-[#d8cfff]"
                    : "border-[rgba(106,60,255,0.12)] bg-[rgba(255,255,255,0.5)] text-[#120d2f] placeholder:text-[#4f4970]/50"
                }`}
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_16px_rgba(106,60,255,0.25)] transition-shadow hover:shadow-[0_6px_20px_rgba(106,60,255,0.35)]"
              >
                <Sparkles size={16} />
              </button>
            </form>
          </div>
        </div>

        <div
          className={`mt-10 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row ${
            darkFooter ? "border-white/10" : "border-[rgba(106,60,255,0.06)]"
          }`}
        >
          <p className={`text-xs ${darkFooter ? "text-[#d8cfff]" : "text-[#4f4970]"}`}>
            &copy; {new Date().getFullYear()} TooolVibes. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-xs transition-colors ${
                  darkFooter ? "text-[#e6ddff] hover:text-white" : "text-[#4f4970] hover:text-[#6a3cff]"
                }`}
                data-sonic-action="nav"
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
