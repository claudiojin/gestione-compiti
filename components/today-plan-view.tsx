'use client';

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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

export function TodayPlanView({ initialPlan, initialTasks }: TodayPlanViewProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<TodayPlan>(initialPlan);
  const [tasks, setTasks] = useState<ClientTask[]>(initialTasks);
  const [refreshState, setRefreshState] = useState<RefreshState>({ status: "idle" });
  const [isTransitioning, startTransition] = useTransition();

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

  const handleRefresh = () => {
    setRefreshState({ status: "loading" });
    startTransition(async () => {
      try {
        const [planRes, tasksRes] = await Promise.all([
          fetch("/api/tasks/today", { cache: "no-store" }),
          fetch("/api/tasks", { cache: "no-store" }),
        ]);

        if (!planRes.ok) {
          throw new Error("Piano AI non disponibile");
        }
        if (!tasksRes.ok) {
          throw new Error("Non sono riuscito a ricaricare le attivita");
        }

        const planJson = await planRes.json();
        const tasksJson = await tasksRes.json();

        setPlan(planJson);
        setTasks(Array.isArray(tasksJson.tasks) ? tasksJson.tasks.map(normalizeTask) : []);
        setRefreshState({ status: "idle" });
      } catch (error) {
        console.error("Failed to refresh plan", error);
        setRefreshState({
          status: "error",
          message: error instanceof Error ? error.message : "Aggiornamento fallito",
        });
      } finally {
        router.refresh();
      }
    });
  };

  return (
    <>
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
            disabled={refreshState.status === "loading" || isTransitioning}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
          >
            {refreshState.status === "loading" || isTransitioning
              ? "Rigenerazione..."
              : "Rigenera piano AI"}
          </button>
        </div>
        {refreshState.status === "error" ? (
          <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200">
            {refreshState.message}
          </p>
        ) : null}
        {plan.advice.length === 0 ? (
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Attivita prioritarie
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Selezionate dal coach AI
          </span>
        </div>
        {focusEntries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Nessuna attivita urgente al momento.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Quando aggiungerai attivita con scadenze o importanza, il piano apparira qui.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {focusEntries.map(({ task, suggestion }) => (
              <div key={task.id} className="space-y-3">
                <TaskCard task={task} />
                {suggestion ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <span className="font-semibold">Consiglio:</span> {suggestion}
                  </div>
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
            Ordinata per priorita residua
          </span>
        </div>
        {remainingActive.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            Tutte le attivita attive sono gia nella lista prioritaria.
          </p>
        ) : (
          <div className="grid gap-4">
            {remainingActive.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Attivita completate
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Le piu recenti finiscono in fondo
          </span>
        </div>
        {completedTasks.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-300 bg-white/50 px-6 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            Completa un&apos;attivita per vederla apparire qui.
          </p>
        ) : (
          <div className="grid gap-4">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
