import OpenAI from "openai";

import type { Task } from "./prisma";
import { calcPriority } from "./priority";

type PlanTask = {
  id: string;
  title: string;
  status: string;
  importance: number;
  aiPriorityScore: number | null;
  dueDate: string | null;
  suggestion?: string;
};

export type TodayPlan = {
  summary: string;
  advice: string[];
  focus: PlanTask[];
};

const openaiClient = createClient();

function createClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function formatTaskForPrompt(task: Task) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    importance: task.importance,
    priority: task.aiPriorityScore ?? calcPriority({ importance: task.importance, dueDate: task.dueDate ?? undefined }),
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    hasNote: Boolean(task.description?.trim()),
  };
}

function fallbackPlan(tasks: Task[]): TodayPlan {
  const active = tasks.filter((task) => task.status.toUpperCase() !== "DONE");
  const sorted = [...active].sort((a, b) => {
    const priorityA = a.aiPriorityScore ?? calcPriority({ importance: a.importance, dueDate: a.dueDate ?? undefined });
    const priorityB = b.aiPriorityScore ?? calcPriority({ importance: b.importance, dueDate: b.dueDate ?? undefined });
    if (priorityA === priorityB) {
      return (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity);
    }
    return priorityB - priorityA;
  });

  const summary =
    active.length === 0
      ? "Agenda libera! Approfitta per pianificare o prenderti una pausa rigenerante."
      : `Concentrati prima su “${sorted[0].title}” e poi gestisci le altre attivita in ordine di importanza e scadenza.`;

  const advice =
    active.length === 0
      ? ["Verifica gli obiettivi della settimana e pianifica il prossimo sprint.", "Dedica tempo all'apprendimento o al recupero di energie."]
      : [
          "Prepara tutto ciò che ti serve per il task principale e blocca una fascia oraria dedicata.",
          "Raggruppa le attivita simili per ridurre i cambi di contesto.",
        ];

  return {
    summary,
    advice,
    focus: sorted.slice(0, 5).map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      importance: task.importance,
      aiPriorityScore: task.aiPriorityScore,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    })),
  };
}

export async function generateTodayPlan(tasks: Task[]): Promise<TodayPlan> {
  if (tasks.length === 0) {
    return {
      summary: "Non ci sono attivita in programma: scegli un obiettivo importante da impostare.",
      advice: ["Identifica un risultato che desideri raggiungere entro questa settimana.", "Pianifica una sessione di brainstorming o revisione strategie."],
      focus: [],
    };
  }

  if (!openaiClient) {
    return fallbackPlan(tasks);
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const formattedTasks = tasks.map(formatTaskForPrompt);

  try {
    const response = await openaiClient.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "Sei un assistente produttivita che parla esclusivamente in italiano. Devi restituire un JSON valido con le chiavi: summary (stringa), advice (array di massimo 5 stringhe brevi) e focus (array di oggetti con id e suggestion). Non aggiungere testo fuori dal JSON.",
        },
        {
          role: "user",
          content: `Ecco la lista delle attivita con priorita e scadenze: ${JSON.stringify(formattedTasks)}`,
        },
      ],
    });

    const content = response.output_text;
    if (!content) {
      return fallbackPlan(tasks);
    }

    let parsed: {
      summary: string;
      advice: string[];
      focus: Array<{ id: string; suggestion?: string }>;
    };

    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```(?:json)?\s*/i, "");
        const closingIndex = cleanContent.lastIndexOf("```");
        if (closingIndex !== -1) {
          cleanContent = cleanContent.slice(0, closingIndex);
        }
        cleanContent = cleanContent.trim();
      }
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("generateTodayPlan JSON parse failed", parseError);
      return fallbackPlan(tasks);
    }

    const taskMap = new Map(tasks.map((task) => [task.id, task]));

    if (typeof parsed.summary !== "string") {
      return fallbackPlan(tasks);
    }

    const adviceList = Array.isArray(parsed.advice)
      ? parsed.advice.map((item) => String(item)).filter((item) => item.length > 0)
      : [];
    const focusSource = Array.isArray(parsed.focus) ? parsed.focus : [];

    const focusTasks = focusSource
      .map((item) => {
        const base = taskMap.get(item.id);
        if (!base) return null;
        return {
          id: base.id,
          title: base.title,
          status: base.status,
          importance: base.importance,
          aiPriorityScore: base.aiPriorityScore,
          dueDate: base.dueDate ? base.dueDate.toISOString() : null,
          suggestion: item.suggestion,
        };
      })
      .filter(Boolean) as PlanTask[];

    if (focusTasks.length === 0) {
      return fallbackPlan(tasks);
    }

    return {
      summary: parsed.summary,
      advice: adviceList.slice(0, 5),
      focus: focusTasks,
    };
  } catch (error) {
    console.error("generateTodayPlan failed", error);
    return fallbackPlan(tasks);
  }
}

type TranscriptionPayload = {
  buffer: ArrayBuffer | Uint8Array | SharedArrayBuffer;
  filename: string;
  mimeType: string;
};

export type TaskSuggestion = {
  title: string;
  description: string;
};

function normalizeBuffer(input: ArrayBuffer | Uint8Array | SharedArrayBuffer): ArrayBuffer {
  if (input instanceof Uint8Array) {
    return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
  }
  if (typeof SharedArrayBuffer !== "undefined" && input instanceof SharedArrayBuffer) {
    const copy = new ArrayBuffer(input.byteLength);
    new Uint8Array(copy).set(new Uint8Array(input));
    return copy;
  }
  return input;
}

export async function transcribeAudio(input: TranscriptionPayload): Promise<string | null> {
  if (!openaiClient) {
    return null;
  }

  const model = process.env.OPENAI_WHISPER_MODEL ?? "whisper-1";
  const arrayBuffer = normalizeBuffer(input.buffer);

  try {
    const blob = new Blob([arrayBuffer], { type: input.mimeType || "audio/webm" });
    const file = new File([blob], input.filename || "voice-input.webm", {
      type: input.mimeType || "audio/webm",
    });

    const transcription: any = await openaiClient.audio.transcriptions.create({
      model,
      file,
      response_format: "text",
    });

    const text = typeof transcription === "string" ? transcription : transcription?.text ?? "";

    return text?.trim() ?? null;
  } catch (error) {
    console.error("transcribeAudio failed", error);
    return null;
  }
}

export async function suggestTaskFromTranscript(
  transcript: string,
): Promise<TaskSuggestion> {
  if (!openaiClient) {
    const fallbackTitle = transcript.split(/[.!?\n]/)[0]?.trim() ?? "Nuova attività";
    return {
      title: fallbackTitle.slice(0, 80) || "Nuova attività",
      description: transcript.trim().slice(0, 400) || "Note importate dalla dettatura.",
    };
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const response = await openaiClient.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "Sei un assistente che trasforma trascrizioni audio in attività. Rispondi solo con un JSON con le chiavi title e description in italiano.",
        },
        {
          role: "user",
          content: `Trascrizione:\n${transcript}\nGenera un oggetto JSON con title (max 80 caratteri) e description (max 400 caratteri).`,
        },
      ],
    });

    let clean = response.output_text?.trim() ?? "";
    if (!clean) {
      throw new Error("Empty response from OpenAI for task suggestion");
    }

    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\s*/i, "");
      const closing = clean.lastIndexOf("```");
      if (closing !== -1) {
        clean = clean.slice(0, closing);
      }
      clean = clean.trim();
    }

    const parsed = JSON.parse(clean) as { title?: string; description?: string };
    const title =
      (parsed.title && String(parsed.title).trim().slice(0, 80)) ||
      transcript.split(/[.!?\n]/)[0]?.trim().slice(0, 80) ||
      "Nuova attività";
    const description =
      (parsed.description && String(parsed.description).trim().slice(0, 400)) ||
      transcript.trim().slice(0, 400) ||
      "Note importate dalla dettatura.";

    return { title, description };
  } catch (error) {
    console.error("suggestTaskFromTranscript failed", error);
    const fallbackTitle =
      transcript.split(/[.!?\n]/)[0]?.trim().slice(0, 80) || "Nuova attività";
    return {
      title: fallbackTitle,
      description: transcript.trim().slice(0, 400) || "Note importate dalla dettatura.",
    };
  }
}
