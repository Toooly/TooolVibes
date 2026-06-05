"use client";

import Link from "next/link";
import { Globe, MessageCircle, Mail, Send } from "lucide-react";

const actions = [
  { icon: Globe, label: "LinkedIn", href: "#" },
  { icon: MessageCircle, label: "Community", href: "#" },
  { icon: Mail, label: "Newsletter", href: "#" },
  { icon: Send, label: "Suggerisci il tuo tool", href: "/wishlist" },
];

export function HomeFinalSection() {
  return (
    <section className="relative z-10 px-4 py-16 md:px-8 md:py-20 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold leading-tight text-white">
          Resta dentro l&apos;orbita TooolVibes
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/60 sm:text-base">
          Seguici, suggerisci un tool, entra nel circuito.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/85 backdrop-blur-md transition-all hover:border-[#6a3cff]/40 hover:bg-white/10"
              >
                <Icon size={16} />
                {action.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <a
            href="mailto:hello@tooolvibes.com"
            className="text-sm text-white/40 transition-colors hover:text-white/70"
          >
            hello@tooolvibes.com
          </a>
        </div>
      </div>
    </section>
  );
}
