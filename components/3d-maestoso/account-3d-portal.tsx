"use client";

import { motion } from "motion/react";

export function Account3DPortal({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden py-12">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(124,77,255,0.12) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(0,229,255,0.08) 0%, transparent 50%)",
        }}
      />
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ perspective: 1000 }}
      >
        <div className="v-glass-strong rounded-3xl p-8 v-preserve-3d">
          <div className="mb-6 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#7C4DFF]">
              Portale di accesso
            </p>
            <h1 className="text-3xl font-bold text-[#F0EFFF]">Account</h1>
            <p className="mt-2 text-sm text-[#9E99B8]">
              Gestisci accesso e salvataggi personali su TooolVibes.
            </p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
