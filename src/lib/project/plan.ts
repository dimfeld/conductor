import { dump, load } from 'js-yaml';
import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';

/**
 * Zod schemas for the project plan structure defined in docs/plan.yml
 */

export const subtaskSchema = z.object({
  title: z.string(),
  plan_file: z.string().optional().describe('Location of the plan file for this subtask'),
  completed: z.boolean(),
});

export const storySchema = z.object({
  title: z.string(),
  completed: z.boolean().default(false),
  description: z.string().optional(),
  plan_file: z.string().optional().describe('Location of the plan file for this story'),
  testing: z.string().optional(),
  subtasks: z.array(subtaskSchema).optional(),
});

export const epicSchema = z.object({
  title: z.string(),
  focus: z.string(),
  plan_file: z.string().optional().describe('Location of the plan file for this epic'),
  stories: z.array(storySchema),
});

export const projectPlanSchema = z.object({
  plan: z.array(epicSchema),
  dependencies: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
});

export class ManagedProjectPlan {
  constructor(
    public data: ProjectPlan,
    public path: string
  ) {}

  async update(updater: (data: ProjectPlan) => ProjectPlan) {
    this.data = updater(this.data);
    await this.save();
  }

  async refresh() {
    this.data = await loadProjectPlan(this.path);
  }

  async save() {
    await writeFile(this.path, dump(this.data));
  }
}

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

/**
 * Load and parse the project plan from docs/plan.yml
 * @throws {Error} if file cannot be read or parsed
 * @throws {ZodError} if plan validation fails
 */
export async function loadProjectPlan(path: string): Promise<ProjectPlan> {
  try {
    // Read the YAML file
    const yamlContent = await readFile(path, 'utf8');

    // Parse YAML to JavaScript object
    const parsedYaml = load(yamlContent);

    // Validate and return the plan
    return projectPlanSchema.parse(parsedYaml);
  } catch (error) {
    if (error instanceof Error) {
      error.message = `Failed to load project plan: ${error.message}`;
    }
    throw error;
  }
}

/**
 * Safe version of loadProjectPlan that returns null instead of throwing
 */
export async function safeLoadProjectPlan(path: string): Promise<ProjectPlan | null> {
  try {
    return await loadProjectPlan(path);
  } catch (error) {
    return null;
  }
}

export interface StoryReference {
  epic: number;
  story: number;
}

export interface SubtaskReference {
  epic: number;
  story: number;
  subtask?: number;
}

/**
 * Get the next incomplete story from the project plan
 */
export function getNextIncompleteStory(plan: ProjectPlan): StoryReference | null {
  for (let i = 0; i < plan.plan.length; i++) {
    const epic = plan.plan[i];
    for (let j = 0; j < epic.stories.length; j++) {
      const story = epic.stories[j];
      if (!story.completed) return { epic: i, story: j };
    }
  }
  return null;
}

/**
 * Get the next incomplete subtask from a story. If then next unfinished story has no subtasks,
 * we just return it.
 */
export function getNextIncompleteSubtask(plan: ProjectPlan) {
  const storyRef = getNextIncompleteStory(plan);
  if (!storyRef) return null;

  const story = plan.plan[storyRef.epic].stories[storyRef.story];

  if (story.subtasks?.length) {
    for (let i = 0; i < story.subtasks?.length; i++) {
      const subtask = story.subtasks[i];
      if (!subtask.completed) return { epic: storyRef.epic, story: storyRef.story, subtask: i };
    }
  }

  return { epic: storyRef.epic, story: storyRef.story };
}
