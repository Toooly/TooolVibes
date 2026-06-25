"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setStatus("error");
      setMessage("Inserisci un indirizzo email valido.");
      return;
    }

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok || res.status === 200) {
        setStatus("success");
        setMessage(data.message || "Grazie! Ti avviseremo quando TooolVibes sarà aperto.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Errore durante l'iscrizione. Riprova.");
      }
    } catch {
      setStatus("error");
      setMessage("Errore di connessione. Riprova.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          placeholder="La tua email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading" || status === "success"}
          className="h-12 flex-1 rounded-xl border-[rgba(124,77,255,0.25)] bg-[rgba(18,18,42,0.6)] px-4 text-[#F0EFFF] placeholder:text-[#6B6690] focus-visible:border-[rgba(124,77,255,0.5)] focus-visible:ring-[rgba(124,77,255,0.25)]"
        />
        <Button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="h-12 rounded-xl bg-[#7C4DFF] px-6 text-white hover:bg-[#6935FF]"
        >
          {status === "loading" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {status === "success" ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : null}
          Avvisami
        </Button>
      </div>

      {message && (
        <p
          className={`mt-3 text-sm ${
            status === "success" ? "text-[#64FFDA]" : "text-[#FF5252]"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
