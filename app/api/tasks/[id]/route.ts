import { NextResponse } from "next/server";

import { deleteTask, updateTask } from "@/lib/tasks";
import { taskIdSchema, updateTaskSchema } from "@/lib/validators";

type RouteContext = {
  params: {
    id: string;
  };
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

export async function PATCH(request: Request, context: RouteContext) {
  const validation = validateTaskId(context.params.id);
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
    const updated = await updateTask(validation.id, parsedBody.data);
    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update task", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const validation = validateTaskId(context.params.id);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const deleted = await deleteTask(validation.id);
    if (!deleted) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
