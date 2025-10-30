import { NextResponse } from "next/server";

import { generateTodayPlan } from "@/lib/ai";
import { getRequestSession } from "@/lib/session";
import { listTasks } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);
    if (!session.userId) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    // Check if regeneration is explicitly requested via query parameter
    const url = new URL(request.url);
    const forceRegenerate = url.searchParams.get("regenerate") === "true";

    const tasks = await listTasks(session.userId);
    const plan = await generateTodayPlan(tasks, session.userId, forceRegenerate);
    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to generate today plan", error);
    return NextResponse.json(
      {
        summary: "Il servizio AI non è disponibile ora.",
        advice: ["Rivedi la tua lista e scegli un obiettivo principale.", "Suddividi il lavoro in blocchi da 25 minuti."],
        focus: [],
      },
      { status: 500 },
    );
  }
}
