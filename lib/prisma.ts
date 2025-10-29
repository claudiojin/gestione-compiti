import { PrismaClient, Prisma } from "../src/generated/client";
import type { TaskModel } from "../src/generated/models/Task";

// Reuse the Prisma instance across hot reloads in development.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { Prisma };
export type Task = TaskModel;
