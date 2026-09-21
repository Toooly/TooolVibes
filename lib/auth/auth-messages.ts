export function isAuthFailureMessage(message: string) {
  return /non (siamo|sono|riusc|disponib)|errore|pausa|riprova|scadut|non valida|non riuscito|non è ancora|accesso non|collegamento non|interrotto/i.test(
    message,
  );
}

export function mapAuthProviderError(
  error: { message?: string; code?: string } | string | null | undefined,
) {
  const raw =
    typeof error === "string"
      ? error
      : `${error?.code ?? ""} ${error?.message ?? ""}`;
  const detail = raw.toLowerCase();

  if (!detail.trim()) {
    return "Non siamo riusciti a completare l'accesso. Riprova tra poco.";
  }

  if (detail.includes("access_denied") || detail.includes("user cancelled")) {
    return "Accesso interrotto. Puoi riprovare quando vuoi.";
  }

  if (
    detail.includes("not enabled") ||
    detail.includes("unsupported provider")
  ) {
    return "Questo accesso social non è ancora attivo. Usa il link email, oppure riprova tra poco.";
  }

  if (
    detail.includes("already registered") ||
    (detail.includes("identity") &&
      (detail.includes("exists") ||
        detail.includes("linked") ||
        detail.includes("conflict") ||
        detail.includes("taken")))
  ) {
    return "Questa email è già collegata a un account TooolVibes. Entra con il link email, poi collega un account dalle impostazioni.";
  }

  if (
    detail.includes("code verifier") ||
    detail.includes("pkce") ||
    detail.includes("both auth code")
  ) {
    return "Non siamo riusciti a completare l'accesso in questo browser. Riprova da qui, senza copiare il link.";
  }

  if (detail.includes("redirect") && detail.includes("invalid")) {
    return "Il ritorno dall'accesso non è configurato correttamente. Riprova tra poco.";
  }

  if (
    detail.includes("expired") ||
    detail.includes("already used") ||
    detail.includes("flow_state") ||
    detail.includes("flow state")
  ) {
    return "L'accesso è scaduto o è già stato usato. Riprova.";
  }

  return "Non siamo riusciti a completare l'accesso. Riprova tra poco.";
}
