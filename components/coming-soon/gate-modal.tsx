"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface GateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GateModal({ open, onClose, onSuccess }: GateModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("Inserisci la password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPassword("");
        onSuccess();
      } else {
        setError(data.error || "Accesso non valido. Controlla la password e riprova.");
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(6,6,14,0.72)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[rgba(124,77,255,0.18)] bg-[rgba(10,10,24,0.88)] p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <h3 className="text-lg font-semibold text-[#F0EFFF]">Varco interno</h3>
          <p className="mt-1 text-sm text-[#9E99B8]">
            Inserisci la chiave per accedere al sito completo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-11 w-full rounded-xl border-[rgba(124,77,255,0.2)] bg-[rgba(18,18,42,0.6)] px-4 text-[#F0EFFF] placeholder:text-[#6B6690] focus-visible:border-[rgba(124,77,255,0.5)] focus-visible:ring-[rgba(124,77,255,0.25)]"
            />
          </div>

          {error && (
            <p className="text-sm text-[#FF5252]">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border-[rgba(124,77,255,0.2)] bg-transparent text-[#9E99B8] hover:bg-[rgba(124,77,255,0.08)] hover:text-[#F0EFFF]"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#7C4DFF] text-white hover:bg-[#6935FF]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Entra
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
