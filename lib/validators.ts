import { z } from "zod";

const dueDateInputSchema = z.union([z.string(), z.date()]).optional().nullable();

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  description: z.string().optional(),
  dueDate: dueDateInputSchema,
  importance: z.coerce
    .number()
    .int()
    .min(1, "Importance must be between 1 and 5")
    .max(5, "Importance must be between 1 and 5")
    .optional(),
  status: z.string().trim().min(1).max(20).optional(),
  source: z.string().trim().min(1).max(20).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().optional(),
    dueDate: dueDateInputSchema,
    importance: z.coerce.number().int().min(1).max(5).optional(),
    status: z.string().trim().min(1).max(20).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const taskIdSchema = z.string().cuid("Task ID must be a valid CUID");

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
