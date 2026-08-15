export function AdminSaveBanner({ saved }: { saved?: string }) {
  if (saved !== "1" && saved !== "0") return null;
  const ok = saved === "1";
  return (
    <p
      role="status"
      className="rounded-2xl border px-4 py-3 text-sm font-semibold"
      style={{
        borderColor: ok ? "rgba(57,210,246,0.35)" : "rgba(243,191,76,0.35)",
        background: ok ? "rgba(57,210,246,0.1)" : "rgba(243,191,76,0.1)",
        color: ok ? "#d7f7ff" : "#ffe7a8",
      }}
    >
      {ok ? "Modifiche salvate." : "Salvataggio non persistente su questo runtime."}
    </p>
  );
}
