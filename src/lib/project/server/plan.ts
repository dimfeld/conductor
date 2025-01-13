import { dump, load } from 'js-yaml';
import { readFile, writeFile } from 'node:fs/promises';
import { projectPlanSchema } from '../plan.js';
import type { ProjectPlan } from '../plan.js';

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

/**
 * Load and parse the project plan from docs/plan.yml
 * @throws {Error} if file cannot be read or parsed
 * @throws {ZodError} if plan validation fails
 */
export async function loadProjectPlan(path: string): Promise<ProjectPlan> {
  let yamlContent: string;
  try {
    yamlContent = await readFile(path, 'utf8');
  } catch (e) {
    const emptyPlan: ProjectPlan = {
      plan: [],
      dependencies: [],
      notes: [],
    };
    return emptyPlan;
  }

  try {
    const parsedYaml = load(yamlContent);
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
