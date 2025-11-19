import { NextResponse } from "next/server";

import { suggestTaskFromTranscript } from "@/lib/ai";
import { getRequestSession } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  if (!session.userId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Trascrizione mancante o non valida" },
        { status: 400 },
      );
    }

    const suggestion = await suggestTaskFromTranscript(transcript);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("Task suggestion failed", error);
    return NextResponse.json(
      { error: "Impossibile generare suggerimento" },
      { status: 500 },
    );
  }
}