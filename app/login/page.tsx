import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSessionData } from "@/lib/session";

export default async function LoginPage() {
  const session = await getSessionData();
  if (session.userId) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="text-3xl font-semibold tracking-tight text-slate-900 transition hover:text-slate-600 dark:text-slate-100 dark:hover:text-slate-300"
        >
          Task Pilot
        </Link>
      </div>
      <AuthForm />
      <p className="mt-6 max-w-md text-center text-xs text-slate-500 dark:text-slate-400">
        Accedendo confermi di utilizzare Task Pilot solo per uso personale. Se non hai ancora un account, utilizza la scheda di registrazione per crearne uno.
      </p>
    </div>
  );
}
