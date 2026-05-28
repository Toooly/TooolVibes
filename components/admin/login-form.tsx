"use client";

import { useTransition } from "react";
import { loginAdmin } from "@/app/(admin)/admin/actions/auth";

type LoginFormProps = {
  hasError: boolean;
};

export function LoginForm({ hasError }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await loginAdmin(formData);
    });
  }

  return (
    <form action={handleSubmit} className="mt-7 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/86">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          className="premium-input w-full border-white/14 bg-white/8 text-white placeholder:text-white/40 focus:border-white/34"
          style={{ color: "white" }}
          required
          disabled={isPending}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/86">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="premium-input w-full border-white/14 bg-white/8 text-white placeholder:text-white/40 focus:border-white/34"
          style={{ color: "white" }}
          required
          disabled={isPending}
        />
      </label>

      {hasError ? (
        <p className="text-sm font-medium text-[#ffd1ca]">Credenziali non valide.</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="premium-button premium-button-primary min-h-12 w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {isPending ? "Accesso in corso..." : "Accedi"}
      </button>
    </form>
  );
}
