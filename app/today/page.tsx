import Link from "next/link";
import { redirect } from "next/navigation";

import { TodayPlanView, type ClientTask } from "@/components/today-plan-view";
import { generateTodayPlan } from "@/lib/ai";
import { getServerSession } from "@/lib/session";
import { listTasks } from "@/lib/tasks";

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

export default async function TodayPage() {
  const session = await getServerSession();
  if (!session.userId) {
    redirect("/login");
  }

  const tasks = await listTasks(session.userId);
  const plan = await generateTodayPlan(tasks);
  const clientTasks = tasks.map(toClient);

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
        <p className="mt-4 text-base text-white/80 sm:text-lg">{plan.summary}</p>
      </header>

      <TodayPlanView initialPlan={plan} initialTasks={clientTasks} />
    </div>
  );
}
