import { NextResponse } from "next/server";

import { getRequestSession } from "@/lib/session";
import { createTask, listTasks } from "@/lib/tasks";
import { createTaskSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);
    if (!session.userId) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const tasks = await listTasks(session.userId);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to list tasks", error);
    return NextResponse.json(
      { error: "Failed to load tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getRequestSession(request);
    if (!session.userId) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid task payload",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const task = await createTask(session.userId, parsed.data);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
