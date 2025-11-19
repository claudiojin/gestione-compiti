'use client';

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { BrowserVoiceInput, type VoiceSuggestion } from "@/components/browser-voice-input";

type TaskFormProps = {
  mode?: "create" | "edit";
};

export function TaskForm({ mode = "create" }: TaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [importance, setImportance] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const applyVoiceSuggestion = (suggestion: VoiceSuggestion) => {
    setVoiceTranscript(suggestion.transcript);
    setError(null);
    setSuccess("Trascrizione vocale aggiunta! Modifica e salva quando sei pronto.");

    setTitle((prev) => (prev.trim().length > 0 ? prev : suggestion.title));
    setDescription((prev) => {
      if (!prev.trim()) return suggestion.description;
      return `${prev}\n\n${suggestion.description}`.trim();
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Il titolo e obbligatorio.");
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || undefined,
      importance,
    };

    if (dueDate) {
      payload.dueDate = new Date(dueDate).toISOString();
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null);
          setError(
            (result && (result.error as string)) ||
              "Impossibile salvare l&apos;attivita. Riprova.",
          );
          return;
        }

        setSuccess("Attivita salvata! Reindirizzamento in corso...");
        setError(null);

        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);
      } catch (err) {
        console.error("Salvataggio fallito", err);
        setError("Errore di rete. Controlla la connessione.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/60"
    >
      <div className="space-y-2">
        <label
          htmlFor="task-title"
          className="text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          Titolo
        </label>
        <input
          id="task-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Che cosa devi completare?"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="task-description"
          className="text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
        Dettagli (opzionale)
        </label>
        <textarea
          id="task-description"
          name="description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Aggiungi contesto, obiettivi o note per aiutare l&apos;AI."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          disabled={isPending}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="task-due-date"
            className="text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Scadenza
          </label>
          <input
            id="task-due-date"
            name="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            disabled={isPending}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Importanza
          </label>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={5}
                value={importance}
                onChange={(event) => setImportance(Number(event.target.value))}
                className="h-2 flex-1 appearance-none rounded-full bg-slate-200 accent-slate-900 dark:bg-slate-700 dark:accent-slate-200"
                disabled={isPending}
              />
              <span className="w-16 text-sm font-medium text-slate-700 dark:text-slate-200">
                {importance}/5
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Le attivita piu importanti avranno piu peso nel calcolo della priorita.
            </p>
          </div>
        </div>
      </div>

      <BrowserVoiceInput onSuggestion={applyVoiceSuggestion} />
      {voiceTranscript ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Trascrizione originale
          </p>
          <p className="mt-2 whitespace-pre-wrap">{voiceTranscript}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {success ? (
            <p className="text-sm font-medium text-emerald-600">{success}</p>
          ) : null}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
          >
            {mode === "edit"
              ? isPending
                ? "Salvataggio..."
                : "Salva modifiche"
              : isPending
                ? "Creazione..."
                : "Crea attivita"}
          </button>
        </div>
      </div>
    </form>
  );
}
