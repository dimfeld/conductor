import { z } from 'zod';

export const specSchema = z.object({
  specName: z.string().min(1, "Spec name is required"),
  objective: z.string().min(1, "Objective is required"),
  implementation: z.array(z.string()),
  tasks: z.array(z.object({
    name: z.string().min(1, "Task name is required"),
    prompt: z.string().min(1, "Task prompt is required"),
    evaluation: z.string().optional(),
  })).min(1, "At least one task is required"),
  aider: z.object({
    model: z.string().optional(),
    architect: z.boolean().optional(),
    editable_files: z.array(z.string()).optional(),
    readonly_files: z.array(z.string()).optional(),
  }).optional(),
});

export type SpecSchema = z.infer<typeof specSchema>;