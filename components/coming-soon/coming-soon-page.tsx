"use client";

import { useState } from "react";
import Image from "next/image";
import { StarfieldBackground } from "./starfield-background";
import { WaitlistForm } from "./waitlist-form";
import { GateModal } from "./gate-modal";

export function ComingSoonPage() {
  const [gateOpen, setGateOpen] = useState(false);

  function handleGateSuccess() {
    setGateOpen(false);
    window.location.reload();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <StarfieldBackground />

      {/* Accesso riservato */}
      <button
        onClick={() => setGateOpen(true)}
        className="fixed top-5 right-5 z-50 rounded-full border border-[rgba(124,77,255,0.2)] bg-[rgba(10,10,24,0.6)] px-4 py-2 text-xs font-medium text-[#9E99B8] backdrop-blur-md transition hover:border-[rgba(124,77,255,0.4)] hover:text-[#F0EFFF] hover:bg-[rgba(124,77,255,0.08)]"
      >
        Varco interno
      </button>

      {/* Logo */}
      <div className="relative z-10 mb-6 animate-float">
        <div className="relative mx-auto h-20 w-20 md:h-24 md:w-24">
          <Image
            src="/brand/tooolvibes-logo.png"
            alt="TooolVibes"
            fill
            className="object-contain drop-shadow-[0_0_20px_rgba(124,77,255,0.35)]"
            priority
          />
        </div>
      </div>

      {/* Titolo */}
      <h1 className="relative z-10 max-w-xs text-3xl font-bold leading-tight tracking-tight text-[#F0EFFF] sm:max-w-md sm:text-5xl md:text-6xl">
        <span className="bg-[linear-gradient(135deg,#7C4DFF_0%,#00E5FF_100%)] bg-clip-text text-transparent">
          TooolVibes
        </span>{" "}
        sta arrivando
      </h1>

      {/* Sottotitolo */}
      <p className="relative z-10 mt-4 max-w-sm text-sm leading-relaxed text-[#9E99B8] sm:max-w-md sm:text-base">
        Lasciaci la tua email e ti avviseremo quando TooolVibes sarà aperto al pubblico.
      </p>

      {/* Form */}
      <div className="relative z-10 mt-8 w-full max-w-md">
        <WaitlistForm />
      </div>

      {/* Footer micro */}
      <p className="relative z-10 mt-10 text-xs text-[#6B6690]">
        © {new Date().getFullYear()} TooolVibes. Tutti i diritti riservati.
      </p>

      {/* Gate Modal */}
      <GateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onSuccess={handleGateSuccess}
      />

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
