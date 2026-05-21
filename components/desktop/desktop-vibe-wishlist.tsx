"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Loader2, Send, Sparkles } from "lucide-react";

import {
  directoryFilterGroups,
  directoryLevelFilters,
  type DirectoryToolLevel,
} from "@/lib/data/tooolvibes-directory";
import { playTooolvibesSound } from "@/lib/config/sound";
import {
  saveToolRequest,
  type StoredToolRequest,
  type ToolRequestInput,
} from "@/lib/wishlist/request-tool-store";

type FormState = ToolRequestInput;
type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  toolName: "",
  toolUrl: "",
  category: "ai-app-builder",
  level: "beginner",
  email: "",
  message: "",
};

const checklist = ["Nome tool", "Link ufficiale", "Categoria", "Perche merita"];

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value: string) {
  return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.toolName.trim().length < 2) {
    errors.toolName = "Inserisci il nome del tool.";
  }

  if (!isValidUrl(form.toolUrl.trim())) {
    errors.toolUrl = "Inserisci un URL valido con https://.";
  }

  if (!form.category) {
    errors.category = "Scegli una categoria.";
  }

  if (!form.level) {
    errors.level = "Scegli un livello.";
  }

  if (!isValidEmail(form.email ?? "")) {
    errors.email = "Email non valida.";
  }

  return errors;
}

export function DesktopVibeWishlist() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRequest, setLastRequest] = useState<StoredToolRequest | null>(null);
  const categoryOptions = useMemo(
    () => directoryFilterGroups.filter((group) => group.key !== "all"),
    [],
  );
  const levelOptions = useMemo(
    () => directoryLevelFilters.filter((level) => level.key !== "all"),
    [],
  );

  function updateForm<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      playTooolvibesSound("warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const savedRequest = await saveToolRequest({
        toolName: form.toolName.trim(),
        toolUrl: form.toolUrl.trim(),
        category: form.category,
        level: form.level,
        email: form.email?.trim() || undefined,
        message: form.message?.trim() || undefined,
      });
      setLastRequest(savedRequest);
      setForm(initialForm);
      playTooolvibesSound("success");
    } catch {
      setErrors({ message: "Non sono riuscito a salvare la richiesta. Riprova tra poco." });
      playTooolvibesSound("warning");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="desktop-vibe desktop-vibe-wishlist hidden lg:block">
      <section className="desktop-vibe-section desktop-vibe-wishlist-hero">
        <div>
          <p className="desktop-vibe-eyebrow">Suggerisci in 3D</p>
          <h1>Porta un nuovo tool dentro il campo editoriale.</h1>
          <p>
            La wishlist desktop diventa una console: compili il segnale, vedi il percorso
            di valutazione e invii il tool senza uscire dal flusso.
          </p>
        </div>

        <aside className="desktop-vibe-scan-panel">
          <ClipboardList aria-hidden="true" />
          <span>Criterio</span>
          <strong>Uso reale, fonte chiara, valore pratico.</strong>
          <p>Ogni proposta entra come segnale, poi diventa scheda solo se supera la lettura editoriale.</p>
        </aside>
      </section>

      <section className="desktop-vibe-section desktop-vibe-submit-console">
        <aside className="desktop-vibe-submit-steps" aria-label="Percorso suggerimento">
          {checklist.map((item, index) => (
            <div key={item} className="desktop-vibe-submit-step">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </aside>

        <form className="desktop-vibe-form" onSubmit={handleSubmit} noValidate>
          <div className="desktop-vibe-form-grid">
            <label>
              <span>Nome tool</span>
              <input
                value={form.toolName}
                onChange={(event) => updateForm("toolName", event.target.value)}
                placeholder="Es. Blink, Make, Flowise..."
                aria-invalid={Boolean(errors.toolName)}
              />
              {errors.toolName ? <small>{errors.toolName}</small> : null}
            </label>

            <label>
              <span>URL ufficiale</span>
              <input
                value={form.toolUrl}
                onChange={(event) => updateForm("toolUrl", event.target.value)}
                placeholder="https://..."
                inputMode="url"
                aria-invalid={Boolean(errors.toolUrl)}
              />
              {errors.toolUrl ? <small>{errors.toolUrl}</small> : null}
            </label>

            <label>
              <span>Categoria</span>
              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
              >
                {categoryOptions.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Livello</span>
              <select
                value={form.level}
                onChange={(event) => updateForm("level", event.target.value as DirectoryToolLevel)}
              >
                {levelOptions.map((level) => (
                  <option key={level.key} value={level.key}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="desktop-vibe-form-wide">
              <span>Email opzionale</span>
              <input
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                placeholder="Per aggiornarti sulla valutazione"
                inputMode="email"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <small>{errors.email}</small> : null}
            </label>

            <label className="desktop-vibe-form-wide">
              <span>Perche merita attenzione</span>
              <textarea
                value={form.message}
                onChange={(event) => updateForm("message", event.target.value)}
                placeholder="Cosa fa, per chi e perche dovrebbe entrare in TooolVibes."
                rows={5}
              />
              {errors.message ? <small>{errors.message}</small> : null}
            </label>
          </div>

          <div className="desktop-vibe-form-footer">
            {lastRequest ? (
              <p>
                <CheckCircle2 aria-hidden="true" />
                {lastRequest.toolName} e stato ricevuto.
              </p>
            ) : (
              <p>
                <Sparkles aria-hidden="true" />
                Le proposte migliori diventano schede curate, non link in lista.
              </p>
            )}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 aria-hidden="true" /> : <Send aria-hidden="true" />}
              {isSubmitting ? "Invio in corso" : "Invia segnale"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
