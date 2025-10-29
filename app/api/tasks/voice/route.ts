import { NextResponse } from "next/server";

import { suggestTaskFromTranscript, transcribeAudio } from "@/lib/ai";
import { getRequestSession } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  if (!session.userId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Richiesta multipart non valida" }, { status: 400 });
  }

  const audio = formData.get("audio");
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "File audio mancante" }, { status: 400 });
  }

  const arrayBuffer = await audio.arrayBuffer();
  const transcript = await transcribeAudio({
    buffer: arrayBuffer,
    mimeType: audio.type || "audio/webm",
    filename: audio.name || "voice-input.webm",
  });

  if (!transcript) {
    return NextResponse.json(
      { error: "Trascrizione non disponibile" },
      { status: 502 },
    );
  }

  const suggestion = await suggestTaskFromTranscript(transcript);

  return NextResponse.json({
    transcript,
    suggestion,
  });
}
