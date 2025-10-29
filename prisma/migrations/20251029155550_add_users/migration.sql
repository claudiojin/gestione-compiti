/*
  Warnings:

  - Added the required column `userId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed a default user to attach existing tasks.
INSERT INTO "User" ("id", "email", "passwordHash", "name")
VALUES (
    'seed-user',
    'demo@example.com',
    '$2a$10$7eqJtq98hPqEX7fNZaFWoOhi5ZXwOB8p..pze/3.iU8FES0pJm6Cm',
    'Demo'
);

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
    "source" TEXT NOT NULL DEFAULT 'manual',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("aiPriorityScore", "createdAt", "description", "dueDate", "id", "importance", "source", "status", "title", "updatedAt", "userId")
SELECT "aiPriorityScore", "createdAt", "description", "dueDate", "id", "importance", "source", "status", "title", "updatedAt", 'seed-user' FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
