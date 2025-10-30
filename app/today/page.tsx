import Link from "next/link";
import { redirect } from "next/navigation";

import { TodayPlanView, type ClientTask } from "@/components/today-plan-view";
import type { TodayPlan } from "@/lib/ai";
import { getSessionData } from "@/lib/session";
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
  const session = await getSessionData();
  if (!session.userId) {
    redirect("/login");
  }

  const tasks = await listTasks(session.userId);
  const clientTasks = tasks.map(toClient);

  const placeholderPlan: TodayPlan = {
    summary: "Sto preparando il tuo riepilogo personalizzato...",
    advice: [],
    focus: [],
  };

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

      <TodayPlanView
        initialPlan={placeholderPlan}
        initialTasks={clientTasks}
        fetchPlanOnMount
      />
    </div>
  );
}
