import Link from "next/link";

import { TaskForm } from "@/components/task-form";

export default function AddTaskPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 pb-12 pt-10 sm:px-6 lg:px-8">
      <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
        <Link
          href="/"
          className="text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          ← Torna alle attivita
        </Link>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Aggiungi dettagli per una priorita piu intelligente
        </span>
      </nav>

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Nuova attivita
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Aggiungi tutto il contesto che vuoi: l&apos;AI usa descrizione e scadenza per determinare l&apos;urgenza.
        </p>
      </header>

      <TaskForm />
    </div>
  );
}
