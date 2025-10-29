-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "importance" INTEGER NOT NULL DEFAULT 3,
    "aiPriorityScore" REAL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "source" TEXT NOT NULL DEFAULT 'manual'
);
INSERT INTO "new_Task" ("aiPriorityScore", "createdAt", "description", "dueDate", "id", "importance", "source", "status", "title") SELECT "aiPriorityScore", "createdAt", "description", "dueDate", "id", "importance", "source", "status", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
