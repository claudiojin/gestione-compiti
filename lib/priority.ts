type PriorityInput = {
  dueDate?: Date | string | null;
  importance?: number | null;
  now?: Date;
};

const DEFAULT_IMPORTANCE = 3;
const IMPORTANCE_MAX = 5;
const DEFAULT_LOOKAHEAD_HOURS = 48;

function parseDate(input: Date | string | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function calcPriority({ dueDate, importance, now }: PriorityInput): number {
  const resolvedImportance = Math.min(
    IMPORTANCE_MAX,
    Math.max(1, importance ?? DEFAULT_IMPORTANCE),
  );

  const due = parseDate(dueDate);
  const baseDate = now ?? new Date();
  const rawHours = due
    ? (due.getTime() - baseDate.getTime()) / 3_600_000
    : DEFAULT_LOOKAHEAD_HOURS;

  const hours = rawHours < 0 ? 0 : rawHours;
  const urgency = 1 / (hours + 1);
  const importanceScore = resolvedImportance / IMPORTANCE_MAX;
  const weightedScore = 0.6 * importanceScore + 0.4 * urgency;

  return Number(weightedScore.toFixed(2));
}
