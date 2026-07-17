"use client";

import { useEffect, useState, type FormEvent } from "react";

import type { VibeSignupContext } from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   useAccountSignupForm (B27) — stato del form magic link.
   Campi email/nome/cognome/telefono, prefill email dal contesto
   Vibe Rush e submit con metadata opzionale. Logica invariata
   rispetto al monolite (reset campi solo su invio riuscito).
   ═══════════════════════════════════════════════════════════════ */

type SendMagicLink = (
  email: string,
  metadata?: Record<string, string | number | boolean | null | undefined>,
) => Promise<{ ok: boolean; message: string }>;

export function useAccountSignupForm({
  sendMagicLink,
  vibeContext,
}: {
  sendMagicLink: SendMagicLink;
  vibeContext: VibeSignupContext;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const isVibeRushSignup = vibeContext.source === "vibe-rush";
  const vibeScore = vibeContext.vibes;
  const vibeXp = vibeContext.xp;

  // Prefill email dal contesto URL: nel monolite avveniva nello stesso
  // effetto di mount che leggeva i parametri; qui il contesto arriva al
  // primo render successivo e il risultato osservabile è identico.
  useEffect(() => {
    if (vibeContext.email) {
      setEmail(vibeContext.email);
    }
  }, [vibeContext.email]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const metadata = isVibeRushSignup
      ? {
          source: "vibe-rush",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          vibe_score: vibeScore ? Number(vibeScore) : 0,
          vibe_xp: vibeXp ? Number(vibeXp) : 0,
        }
      : undefined;
    const result = await sendMagicLink(email, metadata);

    if (result.ok) {
      setEmail("");
      setFirstName("");
      setLastName("");
      setPhone("");
    }
  };

  return {
    email,
    setEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    isVibeRushSignup,
    vibeScore,
    vibeXp,
    handleSubmit,
  };
}

export type AccountSignupForm = ReturnType<typeof useAccountSignupForm>;
