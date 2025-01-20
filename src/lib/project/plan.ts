import { z } from 'zod';

/**
 * Zod schemas for the project plan structure defined in docs/plan.yml
 */
export const subtaskSchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  description: z.string().optional(),
  plan_file: z.string().optional().describe('Location of the plan file for this subtask'),
  completed: z.boolean(),
});

export const storySchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  completed: z.boolean().default(false),
  description: z.string().optional(),
  plan_file: z.string().optional().describe('Location of the plan file for this story'),
  testing: z.string().optional(),
  subtasks: z.array(subtaskSchema).optional(),
});

export const epicSchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  description: z.string().optional(),
  plan_file: z.string().optional().describe('Location of the plan file for this epic'),
  stories: z.array(storySchema),
});

export const projectPlanSchema = z.object({
  plan: z.array(epicSchema),
  dependencies: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
});

// Infer TypeScript types from the Zod schemas
export type Epic = z.infer<typeof epicSchema>;
export type Subtask = z.infer<typeof subtaskSchema>;
export type Story = z.infer<typeof storySchema>;
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

export interface StoryIndex {
  epic: number;
  story: number;
}

export interface SubtaskIndex {
  epic: number;
  story: number;
  subtask?: number;
}

export interface StoryReference {
  index: StoryIndex;
  epic: Epic;
  story: Story;
}

export interface SubtaskReference {
  index: SubtaskIndex;
  epic: Epic;
  story: Story;
  subtask: Subtask;
}

/**
 * Get the next incomplete story from the project plan
 */
export function getNextIncompleteStory(plan: ProjectPlan): StoryReference | null {
  for (let i = 0; i < plan.plan.length; i++) {
    const epic = plan.plan[i];
    for (let j = 0; j < epic.stories.length; j++) {
      const story = epic.stories[j];
      if (!story.completed) return { index: { epic: i, story: j }, epic, story };
    }
  }
  return null;
}

/**
 * Get the next incomplete subtask from a story. If then next unfinished story has no subtasks,
 * we just return it.
 */
export function getNextIncompleteSubtask(
  plan: ProjectPlan
): StoryReference | SubtaskReference | null {
  const storyRef = getNextIncompleteStory(plan);
  if (!storyRef || !storyRef.story.subtasks?.length) return storyRef;

  for (let i = 0; i < storyRef.story.subtasks?.length; i++) {
    const subtask = storyRef.story.subtasks[i];
    if (!subtask.completed)
      return {
        index: { ...storyRef.index, subtask: i },
        epic: storyRef.epic,
        story: storyRef.story,
        subtask,
      };
  }

  return storyRef;
}
