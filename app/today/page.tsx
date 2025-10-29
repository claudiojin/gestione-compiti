import Link from "next/link";

import { TaskCard } from "@/components/task-card";
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
};

function toClient(task: Awaited<ReturnType<typeof listTasks>>[number]): ClientTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    importance: task.importance,
    aiPriorityScore: task.aiPriorityScore,
    status: task.status,
    source: task.source,
  };
}

function buildSummary(tasks: ClientTask[]): string {
  const active = tasks.filter((task) => task.status.toUpperCase() !== "DONE");
  if (active.length === 0) {
    return "Agenda libera! Aggiungi un'attivita oppure goditi il tempo libero di oggi.";
  }

  const [first, second] = active;
  if (first && second) {
    return `Inizia con "${first.title}", poi passa a "${second.title}". Mantieni il ritmo completando le altre in sequenza.`;
  }

  if (first) {
    return `Concentrati su "${first.title}" oggi. Portala a termine e avrai gia vinto la mattina.`;
  }

  return "Rivedi la coda e scegli l'attivita di maggior impatto.";
}

export default async function TodayPage() {
  const tasks = (await listTasks()).map(toClient);
  const prioritized = [...tasks].sort((a, b) => {
    const scoreA = a.aiPriorityScore ?? 0;
    const scoreB = b.aiPriorityScore ?? 0;
    if (scoreA === scoreB) {
      return a.createdAt > b.createdAt ? -1 : 1;
    }
    return scoreB - scoreA;
  });
  const focusTasks = prioritized.slice(0, 5);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
        <Link
          href="/"
          className="text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          ← Torna alle attivita
        </Link>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Il riepilogo AI si aggiorna ogni mattina alle 09:00
        </span>
      </nav>

      <header className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 px-6 py-8 text-white shadow-[0_28px_60px_-32px_rgba(16,185,129,0.6)] sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
          Piano di oggi
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
          Il tuo riepilogo di focus
        </h1>
        <p className="mt-4 text-base text-white/80 sm:text-lg">{buildSummary(focusTasks)}</p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Coda di focus
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Prime {focusTasks.length} attivita per priorita AI
          </span>
        </div>
        {focusTasks.length === 0 ? (
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
            {focusTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
