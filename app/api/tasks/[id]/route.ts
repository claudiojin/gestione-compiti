import { NextRequest, NextResponse } from "next/server";

import { getRequestSession } from "@/lib/session";
import { deleteTask, updateTask } from "@/lib/tasks";
import { taskIdSchema, updateTaskSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function validateTaskId(id: string) {
  const parsed = taskIdSchema.safeParse(id);
  if (!parsed.success) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Invalid task id", issues: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }

  return { ok: true as const, id: parsed.data };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getRequestSession(request);
  if (!session.userId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const params = await context.params;
  const validation = validateTaskId(params.id);
  if (!validation.ok) {
    return validation.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedBody = updateTaskSchema.safeParse(payload);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid task update payload", issues: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = await updateTask(session.userId, validation.id, parsedBody.data);
    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update task", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getRequestSession(request);
  if (!session.userId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const params = await context.params;
  const validation = validateTaskId(params.id);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const deleted = await deleteTask(session.userId, validation.id);
    if (!deleted) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
