'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { TaskCard } from "@/components/task-card";
import type { TodayPlan } from "@/lib/ai";

export type ClientTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  importance: number;
  aiPriorityScore: number | null;
  status: string;
  source: string;
};

type TodayPlanViewProps = {
  initialPlan: TodayPlan;
  initialTasks: ClientTask[];
  fetchPlanOnMount?: boolean;
};

type RefreshState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

type ApiTask = Partial<{
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  importance: number;
  aiPriorityScore: number | null;
  status: string;
  source: string;
}>;

function normalizeTask(task: ApiTask): ClientTask {
  const fallbackTitle = task.title ?? "Attivita senza titolo";
  return {
    id: task.id ? String(task.id) : globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    title: String(fallbackTitle),
    description: task.description ?? null,
    dueDate: task.dueDate ?? null,
    createdAt: task.createdAt ?? new Date().toISOString(),
    updatedAt: task.updatedAt ?? task.createdAt ?? new Date().toISOString(),
    importance: Number(task.importance ?? 3),
    aiPriorityScore:
      typeof task.aiPriorityScore === "number" ? task.aiPriorityScore : null,
    status: String(task.status ?? "TODO"),
    source: task.source ? String(task.source) : "manual",
  };
}

export function TodayPlanView({
  initialPlan,
  initialTasks,
  fetchPlanOnMount = false,
}: TodayPlanViewProps) {
  const [plan, setPlan] = useState<TodayPlan>(initialPlan);
  const [tasks, setTasks] = useState<ClientTask[]>(initialTasks);
  const [refreshState, setRefreshState] = useState<RefreshState>(
    fetchPlanOnMount ? { status: "loading" } : { status: "idle" },
  );
  const [isTransitioning, startTransition] = useTransition();

  const fetchPlanAndTasks = useCallback(async (forceRegenerate = false) => {
    const planUrl = forceRegenerate
      ? "/api/tasks/today?regenerate=true"
      : "/api/tasks/today";

    const [planRes, tasksRes] = await Promise.all([
      fetch(planUrl, { cache: "no-store" }),
      fetch("/api/tasks", { cache: "no-store" }),
    ]);

    const planJson = await planRes.json().catch(() => null);
    if (!planRes.ok || !planJson) {
      const message =
        planJson && typeof planJson.error === "string"
          ? planJson.error
          : "Piano AI non disponibile";
      throw new Error(message);
    }

    const tasksJson = await tasksRes.json().catch(() => null);
    if (!tasksRes.ok || !tasksJson) {
      const message =
        tasksJson && typeof tasksJson.error === "string"
          ? tasksJson.error
          : "Non sono riuscito a ricaricare le attivita";
      throw new Error(message);
    }

    setPlan(planJson);
    setTasks(
      Array.isArray(tasksJson.tasks) ? tasksJson.tasks.map(normalizeTask) : [],
    );
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshState({ status: "loading" });
    startTransition(() => {
      // Force regeneration when user clicks the refresh button
      fetchPlanAndTasks(true)
        .then(() => {
          setRefreshState({ status: "idle" });
        })
        .catch((error) => {
          console.error("Failed to refresh plan", error);
          setRefreshState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Aggiornamento fallito",
          });
        });
    });
  }, [fetchPlanAndTasks, startTransition]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- we intentionally hydrate once post-mount
  useEffect(() => {
    if (!fetchPlanOnMount) return;
    // On mount, don't force regeneration - use cache if available
    setRefreshState({ status: "loading" });
    startTransition(() => {
      fetchPlanAndTasks(false)
        .then(() => {
          setRefreshState({ status: "idle" });
        })
        .catch((error) => {
          console.error("Failed to load plan", error);
          setRefreshState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Caricamento fallito",
          });
        });
    });
  }, [fetchPlanOnMount, fetchPlanAndTasks, startTransition]);

  const { focusEntries, remainingActive, completedTasks } = useMemo(() => {
    const taskMap = new Map(tasks.map((task) => [task.id, task]));

    const focusEntries = plan.focus
      .map((item) => {
        const found = taskMap.get(item.id);
        if (!found) return null;
        return { task: found, suggestion: item.suggestion };
      })
      .filter(Boolean) as Array<{ task: ClientTask; suggestion?: string }>;

    const focusIds = new Set(focusEntries.map((entry) => entry.task.id));

    const active = tasks
      .filter((task) => task.status.toUpperCase() !== "DONE")
      .sort((a, b) => {
        const priorityA = a.aiPriorityScore ?? 0;
        const priorityB = b.aiPriorityScore ?? 0;
        if (priorityA === priorityB) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return priorityB - priorityA;
      });

    const remainingActive = active.filter((task) => !focusIds.has(task.id));

    const completedTasks = tasks
      .filter((task) => task.status.toUpperCase() === "DONE")
      .sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );

    return { focusEntries, remainingActive, completedTasks };
  }, [plan, tasks]);

  const isLoading = refreshState.status === "loading" || isTransitioning;

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 px-6 py-8 text-white shadow-[0_28px_60px_-32px_rgba(16,185,129,0.6)] sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
          Piano di oggi
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
          Il tuo riepilogo di focus
        </h1>
        <p className="mt-4 text-base text-white/80 sm:text-lg">{plan.summary}</p>
        {isLoading ? (
          <p className="mt-3 text-sm text-white/70">
            Sto aggiornando il piano con il coach AI...
          </p>
        ) : null}
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white/90 px-6 py-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Coach AI: come organizzarti meglio
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Rigenera il piano quando vuoi un nuovo punto di vista.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
          >
            {isLoading ? "Rigenerazione..." : "Rigenera piano AI"}
          </button>
        </div>
        {refreshState.status === "error" ? (
          <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200">
            {refreshState.message}
          </p>
        ) : null}
        {isLoading ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Sto preparando suggerimenti personalizzati basati sulle tue attivita.
          </p>
        ) : plan.advice.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Aggiungi qualche attivita per ricevere suggerimenti mirati.
          </p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {plan.advice.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60"
              >
                <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-200">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Attivita prioritarie
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Selezionate dal coach AI
          </span>
        </div>
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/80 px-6 py-12 text-center shadow-sm dark:border-emerald-800/60 dark:bg-emerald-900/40">
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">
              Sto selezionando le attivita su cui concentrarti.
            </p>
            <p className="mt-2 text-sm text-emerald-600/80 dark:text-emerald-200/80">
              Tra pochi istanti avrai un focus mirato per oggi.
            </p>
          </div>
        ) : focusEntries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Nessuna attivita urgente al momento.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Continua ad aggiornare le tue attivita per ricevere suggerimenti piu accurati.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {focusEntries.map((entry) => (
              <div
                key={entry.task.id}
                className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-900/40"
              >
                <TaskCard task={entry.task} />
                {entry.suggestion ? (
                  <p className="mt-3 rounded-2xl border border-emerald-200/60 bg-white/60 px-4 py-3 text-sm text-emerald-800 shadow-sm dark:border-emerald-700/60 dark:bg-emerald-900/60 dark:text-emerald-100">
                    {entry.suggestion}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Altre attivita attive
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Continua da qui appena liberi
          </span>
        </div>
        {remainingActive.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Ottimo! Hai lavorato su tutto il resto.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Aggiorna lo stato delle attivita completate per mantenere la lista pulita.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {remainingActive.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 pb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Recentemente completate
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Mantieni lo slancio!
          </span>
        </div>
        {completedTasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Completa qualcosa e festeggiamo!
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Appena completi un&apos;attivita, comparira qui.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
