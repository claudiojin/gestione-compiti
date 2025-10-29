import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";

import { UserMenu } from "./user-menu";

export async function TopNav() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-base font-semibold text-slate-900 transition hover:text-slate-600 dark:text-slate-100 dark:hover:text-slate-300"
        >
          Task Pilot
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link
            href="/"
            className="rounded-full px-3 py-1 transition hover:bg-slate-900/5 dark:hover:bg-slate-200/10"
          >
            Dashboard
          </Link>
          <Link
            href="/today"
            className="rounded-full px-3 py-1 transition hover:bg-slate-900/5 dark:hover:bg-slate-200/10"
          >
            Piano di oggi
          </Link>
          <UserMenu user={user} />
        </nav>
      </div>
    </header>
  );
}
