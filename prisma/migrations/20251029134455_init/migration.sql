-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "importance" INTEGER NOT NULL DEFAULT 3,
    "aiPriorityScore" REAL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "source" TEXT NOT NULL DEFAULT 'manual'
);

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
