'use client';

import { FormEvent, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setFeedback("Email e password sono obbligatorie.");
      return;
    }

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload: Record<string, unknown> = {
      email: trimmedEmail,
      password: trimmedPassword,
    };
    if (mode === "register" && trimmedName) {
      payload.name = trimmedName;
    }

    startTransition(async () => {
      setFeedback(null);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          const message =
            (data && (data.error as string)) ||
            (mode === "login"
              ? "Credenziali non valide. Riprova."
              : "Registrazione non riuscita. Riprova.");
          setFeedback(message);
          return;
        }

        router.push(redirectPath);
        router.refresh();
      } catch (error) {
        console.error("Auth request failed", error);
        setFeedback("Errore di rete. Controlla la connessione e riprova.");
      }
    });
  };

  const switchMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setFeedback(null);
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {mode === "login" ? "Accedi a Task Pilot" : "Crea un nuovo account"}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {mode === "login"
            ? "Organizza la tua giornata con il supporto dell'AI."
            : "Registrati per sincronizzare le tue attività e sfruttare l'AI."}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Es. Martina Rossi"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              disabled={isPending}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tuo.nome@email.com"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            disabled={isPending}
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "login" ? "La tua password" : "Almeno 8 caratteri"}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            disabled={isPending}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-200 dark:text-slate-950 dark:hover:bg-white"
        >
          {isPending
            ? mode === "login"
              ? "Accesso in corso..."
              : "Registrazione in corso..."
            : mode === "login"
              ? "Accedi"
              : "Registrati"}
        </button>

        {feedback ? (
          <p className="text-sm font-medium text-rose-600 dark:text-rose-300">{feedback}</p>
        ) : null}
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>
          {mode === "login" ? "Non hai un account?" : "Hai già un account?"}
        </span>
        <button
          type="button"
          onClick={switchMode}
          className="font-semibold text-slate-900 transition hover:underline dark:text-slate-100"
        >
          {mode === "login" ? "Registrati" : "Accedi"}
        </button>
      </div>
    </div>
  );
}
