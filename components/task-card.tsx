'use client';

import { useRouter } from "next/navigation";
import { useTransition } from "react";

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

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const [isUpdating, startTransition] = useTransition();

  const dueLabel = formatDueDate(task.dueDate);
  const priority = task.aiPriorityScore ?? 0;
  const isDone = task.status.toUpperCase() === "DONE";

  const handleToggleStatus = () => {
    const nextStatus = isDone ? "TODO" : "DONE";
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

  return (
    <article
      className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_12px_24px_-16px_rgba(15,23,42,0.35)] backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h3
            className="line-clamp-2 text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100"
          >
            {task.title}
          </h3>
          {task.description ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
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
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={isUpdating}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-transparent hover:bg-slate-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {isDone ? "Segna da fare" : "Segna completata"}
          </button>
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
