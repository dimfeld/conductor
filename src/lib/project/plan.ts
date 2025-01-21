import { z } from 'zod';

/**
 * Zod schemas for the project plan structure defined in docs/plan.yml
 */
export const subtaskSchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  description: z.string().optional(),
  plan_file: z.string().optional().describe('Location of the plan file for this subtask'),
  completed: z.boolean().default(false),
});

export const taskSchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  completed: z.boolean().optional().default(false),
  description: z.string().optional(),
  plan_file: z.string().optional().describe('Location of the plan file for this task'),
  testing: z.string().optional(),
  subtasks: z.array(subtaskSchema).optional(),
});

export const epicSchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  description: z.string().optional(),
  plan_file: z.string().optional().describe('Location of the plan file for this epic'),
  tasks: z.array(taskSchema),
});

export const projectPlanSchema = z.object({
  plan: z.array(epicSchema),
  dependencies: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
});

// Infer TypeScript types from the Zod schemas
export type Epic = z.infer<typeof epicSchema>;
export type Subtask = z.infer<typeof subtaskSchema>;
export type Task = z.infer<typeof taskSchema>;
export type ProjectPlan = z.infer<typeof projectPlanSchema>;

/**
 * Validate a project plan object
 * @throws {ZodError} if validation fails
 */
export function validateProjectPlan(plan: unknown): ProjectPlan {
  return projectPlanSchema.parse(plan);
}

/**
 * Safe version of validateProjectPlan that returns null instead of throwing
 */
export function safeValidateProjectPlan(plan: unknown): ProjectPlan | null {
  const result = projectPlanSchema.safeParse(plan);
  return result.success ? result.data : null;
}

export interface TaskIndex {
  epic: number;
  task: number;
}

export interface SubtaskIndex {
  epic: number;
  task: number;
  subtask?: number;
}

export interface TaskReference {
  index: TaskIndex;
  epic: Epic;
  task: Task;
}

export interface SubtaskReference {
  index: SubtaskIndex;
  epic: Epic;
  task: Task;
  subtask: Subtask;
}

/**
 * Get the next incomplete task from the project plan
 */
export function getNextIncompleteTask(plan: ProjectPlan): TaskReference | null {
  for (let i = 0; i < plan.plan.length; i++) {
    const epic = plan.plan[i];
    for (let j = 0; j < epic.tasks.length; j++) {
      const task = epic.tasks[j];
      if (!task.completed) return { index: { epic: i, task: j }, epic, task };
    }
  }
  return null;
}

/**
 * Get the next incomplete subtask from a task. If then next unfinished task has no subtasks,
 * we just return it.
 */
export function getNextIncompleteSubtask(
  plan: ProjectPlan
): TaskReference | SubtaskReference | null {
  const taskRef = getNextIncompleteTask(plan);
  if (!taskRef || !taskRef.task.subtasks?.length) return taskRef;

  for (let i = 0; i < taskRef.task.subtasks?.length; i++) {
    const subtask = taskRef.task.subtasks[i];
    if (!subtask.completed)
      return {
        index: { ...taskRef.index, subtask: i },
        epic: taskRef.epic,
        task: taskRef.task,
        subtask,
      };
  }

  return taskRef;
}
