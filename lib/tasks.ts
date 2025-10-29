import type { Prisma, Task } from "@prisma/client";

import { prisma } from "./prisma";
import { calcPriority } from "./priority";
import type { CreateTaskInput, UpdateTaskInput } from "./validators";

const DEFAULT_STATUS = "TODO";
const DEFAULT_SOURCE = "manual";
const DEFAULT_IMPORTANCE = 3;

function sanitizeNullableString(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeStatus(value: string | undefined): string {
  return sanitizeNullableString(value) ?? DEFAULT_STATUS;
}

function sanitizeSource(value: string | undefined): string {
  return sanitizeNullableString(value) ?? DEFAULT_SOURCE;
}

function normalizeDueDate(value: CreateTaskInput["dueDate"]): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export async function listTasks(): Promise<Task[]> {
  return prisma.task.findMany({
    orderBy: [
      { aiPriorityScore: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });
}

export async function getTask(id: string): Promise<Task | null> {
  return prisma.task.findUnique({ where: { id } });
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const dueDate = normalizeDueDate(input.dueDate);
  const importance = input.importance ?? DEFAULT_IMPORTANCE;
  const aiPriorityScore = calcPriority({ dueDate, importance });

  return prisma.task.create({
    data: {
      title: input.title.trim(),
      description: sanitizeNullableString(input.description),
      dueDate,
      importance,
      status: sanitizeStatus(input.status),
      source: sanitizeSource(input.source),
      aiPriorityScore,
    },
  });
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return null;

  const dueDate =
    input.dueDate !== undefined ? normalizeDueDate(input.dueDate) : existing.dueDate;
  const importance = input.importance ?? existing.importance ?? DEFAULT_IMPORTANCE;

  const data: Prisma.TaskUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title.trim();
  }
  if (input.description !== undefined) {
    data.description = sanitizeNullableString(input.description);
  }
  if (input.dueDate !== undefined) {
    data.dueDate = dueDate;
  }
  if (input.importance !== undefined) {
    data.importance = importance;
  }
  if (input.status !== undefined) {
    data.status = sanitizeStatus(input.status);
  }

  if (input.dueDate !== undefined || input.importance !== undefined) {
    data.aiPriorityScore = calcPriority({ dueDate, importance });
  }

  return prisma.task.update({
    where: { id },
    data,
  });
}

export async function deleteTask(id: string): Promise<Task | null> {
  try {
    return await prisma.task.delete({ where: { id } });
  } catch {
    return null;
  }
}
