"use client";

import { useTransition } from "react";

type DeleteWithConfirmProps = {
  action: () => Promise<void>;
  label: string;
  disabled?: boolean;
  confirmMessage?: string;
  variant?: "button" | "menu";
};

export function DeleteWithConfirm({
  action,
  label,
  disabled = false,
  confirmMessage = "Sei sicuro di voler eliminare questo elemento? L'azione è irreversibile.",
  variant = "button",
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
      className={variant === "menu" ? undefined : "tv-cc-btn tv-cc-btn--danger"}
    >
      {isPending ? "Eliminazione..." : label}
    </button>
  );
}
