'use client';

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { VoiceSuggestion } from "./voice-task-input";
import { BrowserVoiceInput } from "./browser-voice-input";

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  uno: 1,
  una: 1,
  un: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  today: 0,
  tomorrow: 1,
};

function formatDateForInput(date: Date): string {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseRelativeDate(text: string | null | undefined): string | null {
  if (!text) return null;
  const normalized = text.toLowerCase();

  const addDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return formatDateForInput(date);
  };

  if (/\b(dopodomani|后天|day after tomorrow)\b/.test(normalized)) {
    return addDays(2);
  }
  if (/\b(domani|明天|tomorrow)\b/.test(normalized)) {
    return addDays(1);
  }
  if (/\b(oggi|今天|today)\b/.test(normalized)) {
    return addDays(0);
  }
  if (/\b(prossim[ao] weekend|questo weekend|fine settimana|this weekend)\b/.test(normalized)) {
    const date = new Date();
    const day = date.getDay();
    const daysUntilSaturday = (6 - day + 7) % 7;
    date.setDate(date.getDate() + daysUntilSaturday);
    return formatDateForInput(date);
  }
  if (/\b(prossim[ao] settimana|next week|下周|下星期)\b/.test(normalized)) {
    return addDays(7);
  }

  const numberMatch = normalized.match(/(?:tra|fra|in)\s+(\d+)\s+(?:giorni|days)/);
  if (numberMatch) {
    return addDays(Number(numberMatch[1]));
  }

  const wordMatch = normalized.match(/(?:tra|fra|in)\s+(zero|uno|una|un|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+(?:giorni|day|days)/);
  if (wordMatch) {
    const value = NUMBER_WORDS[wordMatch[1]];
    if (typeof value === "number") {
      return addDays(value);
    }
  }

  const chineseMatch = normalized.match(/(\d+)\s*天后/);
  if (chineseMatch) {
    return addDays(Number(chineseMatch[1]));
  }

  const englishInMatch = normalized.match(/in\s+(\d+)\s+day/);
  if (englishInMatch) {
    return addDays(Number(englishInMatch[1]));
  }

  return null;
}

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
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setTitle("");
    setDueDate("");
    setImportance(3);
    setNote("");
    setIsExpanded(false);
    setIsVoiceMode(false);
  };

  const handleVoiceSuggestion = (suggestion: VoiceSuggestion) => {
    setTitle(suggestion.title);
    if (suggestion.description) {
      setNote(suggestion.description);
    }

    const detectedDueDate = parseRelativeDate(suggestion.transcript);
    if (detectedDueDate) {
      setDueDate(detectedDueDate);
    }

    if (suggestion.description || detectedDueDate) {
      setIsExpanded(true);
    }

    setIsVoiceMode(false);
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
    if (note.trim()) {
      payload.description = note.trim();
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
            "Non e stato possibile creare l&apos;attivita. Riprova.",
          );
          return;
        }

        setFeedback("Attivita acquisita! L&apos;AI la sta ordinando.");
        resetForm();
        router.refresh();
      } catch (error) {
        console.error("Errore durante l&apos;aggiunta dell&apos;attivita", error);
        setFeedback("Errore di rete: riprova.");
      }
    });
  };

  return (
    <>
      {/* Mobile floating button when minimized */}
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        className={`sm:hidden fixed bottom-6 right-6 z-40 inline-flex items-center justify-center rounded-full bg-slate-900 p-4 text-white shadow-lg transition-all hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white ${isMinimized ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
          }`}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Aggiungi nuova attività"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Main task bar */}
      <section
        className={`transition-all duration-300 ${isMinimized
          ? 'sm:static sm:rounded-3xl sm:border sm:px-6 sm:py-6 sm:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.55)]'
          : 'fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_24px_-16px_rgba(15,23,42,0.35)] backdrop-blur sm:static sm:rounded-3xl sm:border sm:px-6 sm:py-6 sm:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.55)]'
          } dark:border-slate-800 dark:bg-slate-900/80`}
        aria-label="Aggiungi rapidamente un&apos;attivita"
      >
        {!isMinimized && (
          <>
            {/* Mobile minimize button */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="sm:hidden absolute -top-10 right-4 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Nascondi ↓
            </button>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6"
            >
              <div className="flex-1 space-y-3">
                {isVoiceMode ? (
                  <div className="mb-2">
                    <BrowserVoiceInput onSuggestion={handleVoiceSuggestion} />
                    <button
                      type="button"
                      onClick={() => setIsVoiceMode(false)}
                      className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Annulla inserimento vocale
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="quick-task-title"
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Aggiungi un&apos;attivita
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsVoiceMode(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3 w-3"
                        >
                          <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                          <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                        </svg>
                        Voce
                      </button>
                    </div>
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
                )}
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
                    <label className="sm:col-span-2 space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                      Nota veloce
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                        placeholder="Aggiungi dettagli o il prossimo passo..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        disabled={isPending}
                      />
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
          </>
        )}
      </section>
    </>
  );
}
