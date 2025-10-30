import crypto from "crypto";

import OpenAI from "openai";

import type { Task } from "./prisma";
import { calcPriority } from "./priority";
import { prisma } from "./prisma";

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

  const config: {
    apiKey: string;
    baseURL?: string;
  } = { apiKey };

  // 支持自定义 API endpoint（兼容 OpenAI API 的其他服务）
  const baseURL = process.env.OPENAI_API_BASE_URL;
  if (baseURL) {
    config.baseURL = baseURL;
  }

  return new OpenAI(config);
}

function formatTaskForPrompt(task: Task) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    importance: task.importance,
    priority: task.aiPriorityScore ?? calcPriority({ importance: task.importance, dueDate: task.dueDate ?? undefined }),
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    description: task.description?.trim() || null,
  };
}

/**
 * Generate a hash of task data to detect changes
 * Considers: id, title, description, status, importance, dueDate, updatedAt
 */
function generateTasksHash(tasks: Task[]): string {
  const relevantData = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    importance: task.importance,
    dueDate: task.dueDate?.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }));

  // Sort by id to ensure consistent ordering
  relevantData.sort((a, b) => a.id.localeCompare(b.id));

  const dataString = JSON.stringify(relevantData);
  return crypto.createHash("sha256").update(dataString).digest("hex");
}

/**
 * Get cached plan from database if exists and tasks haven't changed
 */
async function getCachedPlan(userId: string, tasksHash: string): Promise<TodayPlan | null> {
  try {
    const cached = await prisma.todayPlan.findUnique({
      where: { userId },
    });

    if (!cached || cached.tasksHash !== tasksHash) {
      return null;
    }

    // Parse the stored JSON data
    return {
      summary: cached.summary,
      advice: JSON.parse(cached.advice),
      focus: JSON.parse(cached.focus),
    };
  } catch (error) {
    console.error("Failed to get cached plan", error);
    return null;
  }
}

/**
 * Save plan to database cache
 */
async function savePlanCache(userId: string, tasksHash: string, plan: TodayPlan): Promise<void> {
  try {
    await prisma.todayPlan.upsert({
      where: { userId },
      create: {
        userId,
        tasksHash,
        summary: plan.summary,
        advice: JSON.stringify(plan.advice),
        focus: JSON.stringify(plan.focus),
      },
      update: {
        tasksHash,
        summary: plan.summary,
        advice: JSON.stringify(plan.advice),
        focus: JSON.stringify(plan.focus),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to save plan cache", error);
  }
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

export async function generateTodayPlan(tasks: Task[], userId: string, forceRegenerate = false): Promise<TodayPlan> {
  if (tasks.length === 0) {
    return {
      summary: "Non ci sono attivita in programma: scegli un obiettivo importante da impostare.",
      advice: ["Identifica un risultato che desideri raggiungere entro questa settimana.", "Pianifica una sessione di brainstorming o revisione strategie."],
      focus: [],
    };
  }

  // Generate hash of current task data
  const tasksHash = generateTasksHash(tasks);

  // Check cache if not forcing regeneration
  if (!forceRegenerate) {
    const cachedPlan = await getCachedPlan(userId, tasksHash);
    if (cachedPlan) {
      console.log("Returning cached plan for user", userId);
      return cachedPlan;
    }
  }

  if (!openaiClient) {
    return fallbackPlan(tasks);
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const formattedTasks = tasks.map(formatTaskForPrompt);

  try {
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "Sei un assistente produttivita che parla esclusivamente in italiano. Analizza le attività considerando titolo, priorità, scadenza e SOPRATTUTTO le note/descrizioni (campo 'description') che contengono dettagli importanti. Devi restituire un JSON valido con le chiavi: summary (stringa che riassume la giornata), advice (array di massimo 5 consigli pratici e specifici basati sulle note delle attività), e focus (array di oggetti con id e suggestion, dove suggestion deve essere un consiglio specifico basato sulla descrizione dell'attività). Non aggiungere testo fuori dal JSON.",
        },
        {
          role: "user",
          content: `Ecco la lista delle attivita con priorita, scadenze e note dettagliate: ${JSON.stringify(formattedTasks, null, 2)}`,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
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

    const plan: TodayPlan = {
      summary: parsed.summary,
      advice: adviceList.slice(0, 5),
      focus: focusTasks,
    };

    // Save to cache
    await savePlanCache(userId, tasksHash, plan);

    return plan;
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
    const copy = new Uint8Array(input.byteLength);
    copy.set(input);
    return copy.buffer;
  }
  if (typeof SharedArrayBuffer !== "undefined" && input instanceof SharedArrayBuffer) {
    const copy = new ArrayBuffer(input.byteLength);
    new Uint8Array(copy).set(new Uint8Array(input));
    return copy;
  }
  return input as ArrayBuffer;
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

    type WhisperTranscription =
      | string
      | {
          text?: string | null;
        };

    const transcription = (await openaiClient.audio.transcriptions.create({
      model,
      file,
      response_format: "text",
    })) as WhisperTranscription;

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
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
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
      temperature: 0.7,
    });

    let clean = response.choices[0]?.message?.content?.trim() ?? "";
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
