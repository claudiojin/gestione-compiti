'use client';

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState, useTransition } from "react";

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: string | null;
    status: string;
    importance: number;
    aiPriorityScore: number | null;
    createdAt: string;
    updatedAt: string;
  };
};

function formatDueDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDue = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = startOfDue.getTime() - startOfToday.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Scade oggi";
  if (diffDays === 1) return "Scade domani";
  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return `In ritardo di ${days} giorno${days === 1 ? "" : "i"}`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function statusLabel(status: string) {
  switch (status.toUpperCase()) {
    case "DONE":
    case "COMPLETE":
      return "Completata";
    case "IN_PROGRESS":
      return "In corso";
    default:
      return "Da fare";
  }
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "TODO", label: "Da fare" },
  { value: "IN_PROGRESS", label: "In corso" },
  { value: "DONE", label: "Completata" },
];

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const [isUpdating, startTransition] = useTransition();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(task.description ?? "");
  const [noteStatus, setNoteStatus] = useState<string | null>(null);

  const dueLabel = formatDueDate(task.dueDate);
  const priority = task.aiPriorityScore ?? 0;

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = event.target.value;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) {
          console.error("Errore nel cambio di stato", await res.text());
        }
      } catch (error) {
        console.error("Errore nel cambio di stato", error);
      } finally {
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    const confirmed = window.confirm("Eliminare questa attivita?");
    if (!confirmed) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          console.error("Errore durante l'eliminazione", await res.text());
        }
      } catch (error) {
        console.error("Errore durante l'eliminazione", error);
      } finally {
        router.refresh();
      }
    });
  };

  const handleNoteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = { description: noteValue.trim() ? noteValue.trim() : null };
    setNoteStatus("Salvataggio...");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          console.error("Errore nel salvataggio della nota", await res.text());
          setNoteStatus("Non e stato possibile salvare la nota.");
          return;
        }
        setNoteStatus("Nota aggiornata.");
        setIsEditingNote(false);
        router.refresh();
      } catch (error) {
        console.error("Errore nel salvataggio della nota", error);
        setNoteStatus("Errore di rete, riprova.");
      }
    });
  };

  return (
    <article
      className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_12px_24px_-16px_rgba(15,23,42,0.35)] backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h3
            className="break-words text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100"
          >
            {task.title}
          </h3>
          {task.description && !isEditingNote ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
              {task.description}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span
              className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-200 transition group-hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30"
            >
              {statusLabel(task.status)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              Priorita {priority.toFixed(2)}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/30">
              Importanza {task.importance}/5
            </span>
            {dueLabel ? (
              <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30">
                {dueLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 gap-2 self-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <label className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Stato
            </label>
            <select
              value={task.status}
              onChange={handleStatusChange}
              disabled={isUpdating}
              className="rounded-full border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 dark:text-slate-200 dark:focus:ring-slate-200/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isUpdating}
            className="inline-flex items-center gap-2 rounded-full border border-transparent bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
          >
            Elimina
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Nota</span>
          <button
            type="button"
            onClick={() => {
              setIsEditingNote((prev) => !prev);
              setNoteStatus(null);
              setNoteValue(task.description ?? "");
            }}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {isEditingNote ? "Annulla" : task.description ? "Modifica nota" : "Aggiungi nota"}
          </button>
        </div>
        {isEditingNote ? (
          <form onSubmit={handleNoteSubmit} className="mt-3 space-y-3">
            <textarea
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
              rows={3}
              placeholder="Annota dettagli, collegamenti o punti aperti..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <div className="flex items-center justify-between gap-3">
              {noteStatus ? (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {noteStatus}
                </span>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingNote(false);
                    setNoteStatus(null);
                    setNoteValue(task.description ?? "");
                  }}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  Chiudi
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                >
                  Salva nota
                </button>
              </div>
            </div>
          </form>
        ) : (
          <p className="mt-2 min-h-[1.5rem] whitespace-pre-wrap text-slate-600 dark:text-slate-300">
            {task.description ? task.description : "Nessuna nota salvata."}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center text-xs text-slate-400 dark:text-slate-500">
        <span>
          Aggiunta{" "}
          {new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
          }).format(new Date(task.createdAt))}
        </span>
      </div>
    </article>
  );
}
