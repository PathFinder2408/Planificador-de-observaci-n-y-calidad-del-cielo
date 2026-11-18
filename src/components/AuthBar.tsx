"use client";

import { useState, type FormEvent } from "react";
import { LogIn, LogOut, User } from "lucide-react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthBarProps {
  user: AuthUser | null;
  onAuthChange: (user: AuthUser | null) => void;
}

export function AuthBar({ user, onAuthChange }: AuthBarProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email, password } : { email, name, password };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { user?: AuthUser; error?: string };
      if (!response.ok || !data.user) {
        throw new Error(data.error ?? "No se pudo autenticar la cuenta. Verifica tus datos.");
      }
      onAuthChange(data.user);
      setOpen(false);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado al iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onAuthChange(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)]">
          <User className="h-3.5 w-3.5 text-[var(--accent-sodium)]" aria-hidden="true" />
          {user.name}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--accent-sodium)] bg-[var(--accent-sodium)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-sodium-contrast)]"
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
        Ingresar
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="auth-dialog-title"
                className="text-lg font-semibold text-[var(--text-primary)]"
              >
                {mode === "login" ? "Ingresar a tu cuenta" : "Crear cuenta"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="mb-1 block text-xs text-[var(--text-secondary)]"
                  >
                    Nombre completo
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="mb-1 block text-xs text-[var(--text-secondary)]"
                >
                  Correo electrónico
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="mb-1 block text-xs text-[var(--text-secondary)]"
                >
                  Contraseña (mínimo 8 caracteres)
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs text-[var(--signal-bad)]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-[var(--accent-sodium)] py-2 text-sm font-semibold text-[var(--accent-sodium-contrast)] disabled:opacity-50"
              >
                {submitting ? "Verificando..." : mode === "login" ? "Ingresar" : "Registrar cuenta"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="mt-4 w-full text-center text-xs text-[var(--accent-sodium)] hover:underline"
            >
              {mode === "login"
                ? "¿No tienes cuenta? Crea una aquí"
                : "¿Ya tienes cuenta? Ingresa aquí"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
