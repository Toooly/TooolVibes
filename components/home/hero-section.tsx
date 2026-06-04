"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Sparkles, Zap, ChevronDown } from "lucide-react";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

function AnimatedText({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.6 + i * 0.06,
            ease: [0.215, 0.61, 0.355, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function HeroSection({
  tools,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  weeklyTool,
}: {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.97]);

  return (
    <motion.section
      ref={sectionRef}
      className="relative min-h-[85vh] flex items-center overflow-hidden px-4 md:px-6 lg:px-12"
      style={{ opacity, scale }}
    >
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-center text-center">
        {/* Copy */}
        <div className="max-w-2xl pt-20 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(106,60,255,0.12)] bg-[rgba(255,255,255,0.6)] px-4 py-1.5 text-xs font-medium text-[#6a3cff] backdrop-blur-md"
          >
            <Sparkles size={14} />
            AI tools discovery system
          </motion.div>

          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-[#120d2f] md:text-5xl lg:text-6xl">
            <AnimatedText text="Scegli tool AI validi" />
            <br />
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, #6a3cff 0%, #39d2f6 60%, #f3bf4c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <AnimatedText text="senza attraversare rumore." />
            </span>
          </h1>

          <motion.p
            className="mb-8 text-lg leading-relaxed text-[#4f4970]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            TooolVibes organizza catalogo, segnali e shortlist in un percorso chiaro:
            trovi alternative credibili, confronti solo ciò che conta e decidi prima.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            <Link
              href="/archivio"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_6px_24px_rgba(106,60,255,0.3)] transition-all hover:shadow-[0_8px_28px_rgba(106,60,255,0.4)]"
            >
              <Zap size={16} className="transition-transform group-hover:rotate-12" />
              Esplora il catalogo
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/wishlist"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(106,60,255,0.15)] bg-[rgba(255,255,255,0.6)] px-6 py-3.5 text-sm font-semibold text-[#120d2f] backdrop-blur-md transition-all hover:bg-[rgba(106,60,255,0.06)] hover:border-[rgba(106,60,255,0.3)]"
            >
              Suggerisci un tool
            </Link>
          </motion.div>

          <motion.div
            className="mt-10 flex items-center justify-center gap-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.5 }}
          >
            {[
              { value: tools.length.toString(), label: "Tool curati" },
              { value: "∞", label: "Possibilità" },
              { value: "3", label: "Rotte decisionali" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-[#120d2f]">{stat.value}</div>
                <div className="text-xs text-[#4f4970]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown size={24} className="text-[#6a3cff] opacity-40" />
      </motion.div>
    </motion.section>
  );
}
