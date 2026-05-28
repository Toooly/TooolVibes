"use client";

import { useTransition } from "react";

type DeleteWithConfirmProps = {
  action: () => Promise<void>;
  label: string;
  disabled?: boolean;
  confirmMessage?: string;
};

export function DeleteWithConfirm({
  action,
  label,
  disabled = false,
  confirmMessage = "Sei sicuro di voler eliminare questo elemento? L'azione è irreversibile.",
}: DeleteWithConfirmProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;

    startTransition(async () => {
      await action();
    });
  }

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={handleClick}
      className="button-shell w-full rounded-full px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
      style={{ background: "linear-gradient(135deg, #9a4130, #7f2f22)" }}
    >
      {isPending ? "Eliminazione..." : label}
    </button>
  );
}
