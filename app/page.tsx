import Link from "next/link";
import { redirect } from "next/navigation";

import { AddTaskBar } from "@/components/add-task-bar";
import { TaskCard } from "@/components/task-card";
import { getSessionData } from "@/lib/session";
import { listTasks } from "@/lib/tasks";

type ClientTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  importance: number;
  aiPriorityScore: number | null;
  status: string;
  source: string;
  updatedAt: string;
};

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function toClient(task: Awaited<ReturnType<typeof listTasks>>[number]): ClientTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    importance: task.importance,
    aiPriorityScore: task.aiPriorityScore,
    status: task.status,
    source: task.source,
  };
}

export default async function Home() {
  const session = await getSessionData();
  if (!session.userId) {
    redirect("/login");
  }

  const tasks = await listTasks(session.userId);
  const clientTasks = tasks.map(toClient);

  const activeTasks = clientTasks
    .filter((task) => task.status.toUpperCase() !== "DONE")
    .sort((a, b) => {
      const priorityA = a.aiPriorityScore ?? 0;
      const priorityB = b.aiPriorityScore ?? 0;
      if (priorityA === priorityB) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return priorityB - priorityA;
    });
  const completedTasks = clientTasks
    .filter((task) => task.status.toUpperCase() === "DONE")
    .sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    );
  const inProgressTasks = clientTasks.filter(
    (task) => task.status.toUpperCase() === "IN_PROGRESS",
  );
  const topTask = activeTasks[0];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-4 sm:px-6 lg:px-10 lg:pb-16 sm:pb-16">
      <header className="flex flex-col gap-4 rounded-3xl border border-transparent bg-gradient-to-r from-slate-900 via-slate-900 to-slate-700 px-5 py-5 text-white shadow-[0_22px_45px_-30px_rgba(15,23,42,0.9)] sm:px-7 sm:py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
              {formatDateLabel(new Date())}
            </p>
            <h1 className="mt-2 text-xl font-semibold leading-tight sm:text-3xl">
              Cosa conta di piu oggi?
            </h1>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/today"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-inner transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              Vedi il piano di oggi
            </Link>
            <Link
              href="/add-task"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              Nuova attivita
            </Link>
          </div>
        </div>
        <div className="grid gap-4 text-sm text-white/80 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/60">
              Attivita aperte
            </p>
            <p className="mt-1 text-2xl font-semibold">{activeTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/60">
              In corso
            </p>
            <p className="mt-1 text-2xl font-semibold">{inProgressTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/60">
              Completate
            </p>
            <p className="mt-1 text-2xl font-semibold">{completedTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur sm:col-span-3">
            <p className="text-xs uppercase tracking-wide text-white/60">
              Priorita principale
            </p>
            <p className="mt-1 text-base font-semibold">
              {topTask ? topTask.title : "Aggiungi un&apos;attivita per iniziare"}
            </p>
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Attivita attive
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Da fare e in corso • ordinate dalla priorita AI
          </span>
        </div>
        {activeTasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-white/70 to-slate-50/70 px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:from-slate-900/60 dark:to-slate-800/60">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Non ci sono attivita in elenco.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Aggiungi qualcosa qui sotto e lascia che l&apos;AI la organizzi.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 pb-4 sm:gap-5">
            {activeTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Attivita completate
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Storico piu recente in cima
          </span>
        </div>
        {completedTasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-white/50 to-slate-50/50 px-6 py-8 text-center shadow-sm dark:border-slate-700 dark:from-slate-900/40 dark:to-slate-800/40">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Completa un&apos;attivita per vederla comparire qui.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 pb-4 sm:gap-5">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <AddTaskBar />
    </div>
  );
}
