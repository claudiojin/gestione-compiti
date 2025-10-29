import { NextResponse } from "next/server";

import { createTask, listTasks } from "@/lib/tasks";
import { createTaskSchema } from "@/lib/validators";

export async function GET() {
  try {
    const tasks = await listTasks();
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

    const task = await createTask(parsed.data);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
