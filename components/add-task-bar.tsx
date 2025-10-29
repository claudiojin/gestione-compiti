'use client';

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

const IMPORTANCE_LEVELS = [
  { value: 1, label: "Bassa" },
  { value: 2, label: "Medio-bassa" },
  { value: 3, label: "Media" },
  { value: 4, label: "Alta" },
  { value: 5, label: "Critica" },
];

export function AddTaskBar() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [importance, setImportance] = useState(3);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setTitle("");
    setDueDate("");
    setImportance(3);
    setIsExpanded(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setFeedback("Aggiungi prima un titolo breve.");
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      importance,
    };
    if (dueDate) {
      const iso = new Date(dueDate).toISOString();
      payload.dueDate = iso;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          setFeedback(
            (error && (error.error as string)) ||
              "Non e stato possibile creare l'attivita. Riprova.",
          );
          return;
        }

        setFeedback("Attivita acquisita! L'AI la sta ordinando.");
        resetForm();
        router.refresh();
      } catch (error) {
        console.error("Errore durante l'aggiunta dell'attivita", error);
        setFeedback("Errore di rete: riprova.");
      }
    });
  };

  return (
    <section
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-12px_24px_-16px_rgba(15,23,42,0.35)] backdrop-blur sm:static sm:rounded-3xl sm:border sm:px-6 sm:py-6 sm:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.55)] dark:border-slate-800 dark:bg-slate-900/80"
      aria-label="Aggiungi rapidamente un&apos;attivita"
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6"
      >
        <div className="flex-1 space-y-3">
          <div>
            <label
              htmlFor="quick-task-title"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Aggiungi un&apos;attivita
            </label>
            <input
              id="quick-task-title"
              name="title"
              placeholder="es. Invia aggiornamento progetto"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-200"
              disabled={isPending}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex w-max items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {isExpanded ? "Nascondi dettagli" : "Aggiungi dettagli"}
          </button>
          {isExpanded ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                Scadenza
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  disabled={isPending}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                Importanza
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
                  <span className="w-20 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {IMPORTANCE_LEVELS.find((level) => level.value === importance)?.label}
                  </span>
                </div>
              </label>
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
          >
            {isPending ? "Sto aggiungendo..." : "Aggiungi subito"}
          </button>
          {feedback ? (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {feedback}
            </p>
      ) : null}
        </div>
      </form>
    </section>
  );
}
