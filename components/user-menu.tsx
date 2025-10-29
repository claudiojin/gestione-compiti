'use client';

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type UserSummary = {
  id: string;
  email: string;
  name?: string | null;
};

type UserMenuProps = {
  user: UserSummary;
};

function displayName(user: UserSummary) {
  if (user.name && user.name.trim().length > 0) {
    return user.name.trim();
  }
  return user.email;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const label = useMemo(() => displayName(user), [user]);

  const handleLogout = () => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        if (!res.ok) {
          setFeedback("Impossibile uscire. Riprova.");
          return;
        }
        router.push("/login");
        router.refresh();
      } catch (error) {
        console.error("Logout failed", error);
        setFeedback("Errore di rete durante il logout.");
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-200 sm:inline">
        {label}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
      >
        {isPending ? "Uscendo..." : "Esci"}
      </button>
      {feedback ? (
        <span className="text-xs font-medium text-rose-600 dark:text-rose-300">{feedback}</span>
      ) : null}
    </div>
  );
}
