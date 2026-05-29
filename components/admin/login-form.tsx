"use client";

import { useFormStatus } from "react-dom";

import { loginAdmin } from "@/app/(admin)/admin/actions/auth";

type LoginFormProps = {
  hasError: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="premium-button premium-button-primary min-h-12 w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
    >
      {pending ? "Accesso in corso..." : "Accedi"}
    </button>
  );
}

export function LoginForm({ hasError }: LoginFormProps) {
  return (
    <form action={loginAdmin} className="mt-7 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/86">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          className="premium-input w-full border-white/14 bg-white/8 text-white placeholder:text-white/40 focus:border-white/34"
          style={{ color: "white" }}
          required
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
        />
      </label>

      {hasError ? (
        <p className="text-sm font-medium text-[#ffd1ca]">Credenziali non valide.</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
