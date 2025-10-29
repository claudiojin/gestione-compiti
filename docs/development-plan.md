# Task Manager Development Plan

## 1. Product Scope
- Build a local-first, lightweight, extensible task management application.
- Support quick task capture, AI-assisted prioritisation, and a daily plan surface.
- Optimise for minimal backend complexity by staying within Next.js API routes and SQLite.

## 2. Tech Stack
| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), Tailwind CSS |
| Database | SQLite (local file, optional Vercel Postgres) |
| ORM | Prisma |
| AI | OpenAI GPT-5 API, Whisper API |
| Scheduling | node-cron (server-only execution) |

## 3. Architecture Overview
- **UI**: Next.js App Router pages under `/app`.
- **API**: REST-like handlers implemented via App Router API routes (`/app/api/...`).
- **Database Access**: Prisma client singleton under `/lib`.
- **AI Integrations**: Centralised helper (`/lib/ai.ts`) for GPT-5 and Whisper usage.
- **Cron**: `node-cron` scheduler initialised server-side to generate the daily plan at 09:00.

```
UI (Next.js) --> API Routes --> Prisma --> SQLite
                       \--> OpenAI (GPT-5 + Whisper)
node-cron ----> API `getTodayPlan`
```

## 4. Core Modules & Features
| Module | Capabilities |
| --- | --- |
| Task Management | Create, edit, complete, delete tasks. |
| Auto Priority | Combine due date, manual importance, and AI scoring. |
| Daily Plan | Produce a morning summary of the most urgent tasks. |
| Voice Input | Upload audio, transcribe with Whisper, auto-generate tasks. |
| External API | Allow external systems to POST new tasks. |
| Notifications (optional) | Present a “Today’s Plan” modal each morning. |

## 5. Data Model (Prisma)
```prisma
model Task {
  id              String    @id @default(cuid())
  title           String
  description     String?
  createdAt       DateTime  @default(now())
  dueDate         DateTime?
  importance      Int       @default(3)
  aiPriorityScore Float?
  status          String    @default("TODO")
  source          String    @default("manual")

  @@index([status])
  @@index([dueDate])
}
```

## 6. API Surface
- `POST /api/tasks`: create task, return ID + computed `aiPriorityScore`.
- `GET /api/tasks`: list tasks sorted by priority and created date.
- `PATCH /api/tasks/:id`: update mutable fields (status, title, etc.).
- `DELETE /api/tasks/:id`: remove a task.
- `POST /api/tasks/voice`: receive multipart audio, transcribe via Whisper, generate tasks.
- `GET /api/tasks/today`: return AI-crafted summary plus prioritised task list.

## 7. Priority Calculation
```ts
export function calcPriority(task: Task): number {
  const hours = task.dueDate ? (task.dueDate.getTime() - Date.now()) / 3_600_000 : 48;
  const urgency = 1 / (hours + 1);
  const importance = (task.importance ?? 3) / 5;
  return Number((0.6 * importance + 0.4 * urgency).toFixed(2));
}
```
- Baseline priority is calculated locally and stored in `aiPriorityScore`.
- GPT-5 can be used to refine the score when richer context is available.

## 8. AI Integration Strategy
- Wrap OpenAI calls in `/lib/ai.ts` with reusable functions:
  - `analyzeTaskForPriority(task)`: optional GPT-5 refinement.
  - `transcribeAudio(file)`: Whisper transcription helper.
  - `generateTodayPlan(tasks)`: produce summary and ordered tasks.
- Add graceful degradation: if API keys are missing or OpenAI fails, fall back to local priority logic and a static summary.
- Store API credentials in `.env.local` (`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_WHISPER_MODEL`).

## 9. Scheduling
- Use `node-cron` to trigger `getTodayPlan()` daily at 09:00.
- Expose an environment flag (e.g., `CRON_ENABLED`) to disable scheduling in environments where it is not needed.
- Ensure cron initialisation only runs once (guard against dev hot reload).

## 10. Project Structure
```
/app
  page.tsx              // Main dashboard with task list & add bar
  add-task.tsx          // Dedicated task creation page (optional)
  today.tsx             // Daily plan view
  /api
    /tasks
      route.ts          // GET (list) + POST (create)
      [id]/route.ts     // PATCH + DELETE
    /tasks/voice
      route.ts          // Whisper-based input
    /tasks/today
      route.ts          // Daily plan generation
/lib
  prisma.ts             // Prisma client singleton
  priority.ts           // Priority calculation helpers
  validators.ts         // Zod schemas for API validation
  ai.ts                 // OpenAI helper functions
  tasks.ts              // Task service layer
  cron.ts               // Cron initialisation
/prisma
  schema.prisma
```

## 11. Implementation Roadmap (Backend First)
1. Initialise Prisma + SQLite, define schema, and run the first migration.
2. Build shared utilities (`/lib/prisma.ts`, `/lib/priority.ts`, `/lib/validators.ts`).
3. Implement `/api/tasks` POST + GET with validation and local priority scoring.
4. Add `/api/tasks/[id]` for PATCH/DELETE, including status transitions.
5. Integrate basic AI priority refinement and safe fallbacks.
6. Create `/api/tasks/today` summary endpoint with GPT-5 + fallback.
7. Implement `/api/tasks/voice` with file parsing, Whisper transcription, and task creation.
8. Wire up `node-cron` to trigger daily plan generation; expose manual trigger for dev.
9. Add tests for critical API flows (mock OpenAI), document usage, and prepare for frontend integration.

## 12. Risks & Mitigations
- **AI Dependency**: provide offline fallbacks and clear error handling.
- **Cron in Serverless**: ensure runtime is Node.js (not Edge) and guard against multiple schedulers.
- **File Upload Handling**: select a robust multipart parser and restrict file size.
- **Priority Accuracy**: offer manual importance override and surface AI score for transparency.

