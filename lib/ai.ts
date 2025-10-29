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
