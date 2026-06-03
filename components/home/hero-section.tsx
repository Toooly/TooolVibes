"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Sparkles, Zap, ChevronDown } from "lucide-react";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { TiltCard } from "./tilt-card";

function AnimatedText({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 40, rotateX: -80 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.8 + i * 0.08,
            ease: [0.215, 0.61, 0.355, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

function FloatingToolOrbit({ tools }: { tools: DirectoryTool[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  const orbitItems = tools.slice(0, 5).map((tool, i) => {
    const angle = (i / 5) * Math.PI * 2;
    const radius = 140;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const delay = i * 0.5;

    return (
      <motion.div
        key={tool.slug}
        className="absolute"
        style={{
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          x: [0, Math.cos(angle + Math.PI / 2) * 15, 0],
          y: [0, Math.sin(angle + Math.PI / 2) * 15, 0],
        }}
        transition={{
          duration: 4 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
      >
        <motion.div
          whileHover={{ scale: 1.15 }}
          style={{
            transform: `translate(${mousePos.x * (0.5 + i * 0.1)}px, ${mousePos.y * (0.5 + i * 0.1)}px)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          <Link
            href={`/toools/${tool.slug}`}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-[rgba(106,60,255,0.15)] bg-[rgba(255,255,255,0.8)] p-3 shadow-[0_8px_24px_rgba(106,60,255,0.1)] backdrop-blur-md transition-all hover:border-[#6a3cff] hover:shadow-[0_12px_32px_rgba(106,60,255,0.2)]"
          >
            <DirectoryToolGlyph tool={tool} size="sm" />
            <span className="text-[10px] font-medium text-[#120d2f]">{tool.name}</span>
          </Link>
        </motion.div>
      </motion.div>
    );
  });

  return (
    <div ref={containerRef} className="relative h-[420px] w-[420px] hidden lg:block">
      {/* Central glow */}
      <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(106,60,255,0.15)] blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(57,210,246,0.2)] blur-2xl" />

      {/* Orbit rings */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(106,60,255,0.08)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(57,210,246,0.06)]"
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Center core */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6a3cff] to-[#39d2f6] shadow-[0_0_40px_rgba(106,60,255,0.4)]">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
      </motion.div>

      {orbitItems}
    </div>
  );
}

export function HeroSection({
  tools,
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

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const focusTool = weeklyTool ?? tools[0];
  const orbitTools = focusTool
    ? [focusTool, ...tools.filter((t) => t.slug !== focusTool.slug)]
    : tools;

  return (
    <motion.section
      ref={sectionRef}
      className="relative min-h-[90vh] flex items-center overflow-hidden px-4 md:px-6 lg:px-12"
      style={{ opacity, scale }}
    >
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-center gap-12 lg:flex-row lg:justify-between">
        {/* Copy */}
        <div className="max-w-xl pt-20 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(106,60,255,0.15)] bg-[rgba(255,255,255,0.6)] px-4 py-1.5 text-xs font-medium text-[#6a3cff] backdrop-blur-md shadow-[0_4px_16px_rgba(106,60,255,0.08)]"
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles size={14} />
            </motion.span>
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
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            TooolVibes organizza catalogo, segnali e shortlist in un percorso chiaro:
            trovi alternative credibili, confronti solo ciò che conta e decidi prima.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
          >
            <Link
              href="/archivio"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(106,60,255,0.4)] transition-all hover:shadow-[0_12px_40px_rgba(106,60,255,0.55)] hover:scale-[1.03] active:scale-[0.98]"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-[#39d2f6] to-[#6a3cff] opacity-0 transition-opacity group-hover:opacity-100"
              />
              <span className="relative z-10 flex items-center gap-2">
                <Zap size={16} className="transition-transform group-hover:rotate-12" />
                Esplora il catalogo
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/wishlist"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(106,60,255,0.2)] bg-[rgba(255,255,255,0.6)] px-6 py-3.5 text-sm font-semibold text-[#120d2f] backdrop-blur-md transition-all hover:bg-[rgba(106,60,255,0.08)] hover:border-[#6a3cff] hover:shadow-[0_4px_16px_rgba(106,60,255,0.15)]"
            >
              Suggerisci un tool
            </Link>
          </motion.div>

          <motion.div
            className="mt-10 flex items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.6 }}
          >
            {[
              { value: tools.length.toString(), label: "Tool curati" },
              { value: "∞", label: "Possibilità" },
              { value: "3", label: "Rotte decisionali" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <motion.div
                  className="text-2xl font-bold text-[#120d2f]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 2.2, type: "spring", stiffness: 200 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-xs text-[#4f4970]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* 3D Visual */}
        <motion.div style={{ y }} className="hidden lg:block">
          <FloatingToolOrbit tools={orbitTools.slice(0, 5)} />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown size={24} className="text-[#6a3cff] opacity-50" />
      </motion.div>
    </motion.section>
  );
}
