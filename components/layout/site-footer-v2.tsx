"use client";

import Link from "next/link";
import { motion } from "motion/react";
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

function FooterLink({ href, label, icon: Icon }: { href: string; label: string; icon?: React.ComponentType<{ className?: string; size?: number }> }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 text-sm text-[#4f4970] transition-all duration-200 hover:text-[#6a3cff] hover:translate-x-1" data-sonic-action="nav"
    >
      {Icon && <Icon size={14} className="text-[#6a3cff] opacity-50 group-hover:opacity-100 transition-opacity" />}
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
    <footer className="relative mt-auto overflow-hidden border-t border-[rgba(106,60,255,0.1)]">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(106,60,255,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(57,210,246,0.12) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-6 py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="group inline-flex items-center gap-3 mb-6">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.3 }}>
                <BrandLogo size={40} />
              </motion.div>
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
            <p className="text-sm text-[#4f4970] leading-relaxed mb-6 max-w-xs">
              Il sistema di discovery per tool AI, SaaS, no-code e vibe coding.
              Trova, confronta e costruisci il tuo stack perfetto.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Code2, href: "#", label: "Twitter" },
                { icon: Globe, href: "#", label: "GitHub" },
                { icon: Mail, href: "mailto:hello@tooolvibes.com", label: "Email" },
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(106,60,255,0.15)] bg-[rgba(255,255,255,0.6)] text-[#4f4970] transition-colors hover:border-[#6a3cff] hover:text-[#6a3cff] hover:bg-[rgba(106,60,255,0.08)]"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#2d255d]">
              Esplora
            </h3>
            <div className="flex flex-col gap-3">
              {footerLinks.explore.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </div>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#2d255d]">
              Community
            </h3>
            <div className="flex flex-col gap-3">
              {footerLinks.community.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#2d255d]">
              Resta aggiornato
            </h3>
            <p className="text-sm text-[#4f4970] mb-4">
              Ricevi ogni settimana i tool AI più innovativi direttamente nella tua inbox.
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
                className="flex-1 rounded-xl border border-[rgba(106,60,255,0.15)] bg-[rgba(255,255,255,0.6)] px-4 py-2.5 text-sm text-[#120d2f] placeholder:text-[#4f4970]/50 outline-none transition-all focus:border-[#6a3cff] focus:ring-2 focus:ring-[rgba(106,60,255,0.15)]"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_16px_rgba(106,60,255,0.35)]"
              >
                <Sparkles size={16} />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[rgba(106,60,255,0.08)] pt-8 md:flex-row">
          <p className="text-xs text-[#4f4970]">
            © {new Date().getFullYear()} TooolVibes. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-[#4f4970] transition-colors hover:text-[#6a3cff]" data-sonic-action="nav"
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
