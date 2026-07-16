"use client";

import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

interface FloatingSectionAnchorProps {
  label?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function FloatingSectionAnchor({
  label,
  title,
  description,
  action,
  className = "",
}: FloatingSectionAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className={`relative z-10 flex min-h-[75vh] items-center justify-center px-4 md:px-6 lg:px-12 ${className}`}
      aria-label={title}
    >
      <motion.div
        className="mx-auto max-w-xl text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
      >
        {label && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(106,60,255,0.1)] bg-[rgba(255,255,255,0.4)] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[#6a3cff] backdrop-blur-sm"
            data-orbit-shield
          >
            {label}
          </motion.span>
        )}

        <h2
          className="mb-3 text-3xl font-bold tracking-tight text-[#120d2f] md:text-4xl lg:text-[2.75rem] lg:leading-tight drop-shadow-[0_2px_12px_rgba(255,255,255,0.7)]"
          data-orbit-shield
          data-orbit-shield-priority="high"
        >
          {title}
        </h2>

        {description && (
          <p
            className="mx-auto max-w-md text-base leading-relaxed text-[#4f4970]/80 drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)]"
            data-orbit-shield
          >
            {description}
          </p>
        )}

        {action && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-6"
            data-orbit-shield
          >
            <Link
              href={action.href}
              data-sonic-action="nav"
              className="group inline-flex items-center gap-2 rounded-xl border border-[rgba(106,60,255,0.12)] bg-[rgba(255,255,255,0.5)] px-5 py-2.5 text-sm font-medium text-[#120d2f] backdrop-blur-md transition-all hover:bg-[rgba(106,60,255,0.06)] hover:border-[rgba(106,60,255,0.25)]"
            >
              {action.label}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* Decorative orbital hint line */}
      <div className="pointer-events-none absolute bottom-12 left-1/2 h-16 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[rgba(106,60,255,0.15)] to-transparent" />
    </section>
  );
}
