import { dump, load } from 'js-yaml';
import { readFile, writeFile } from 'node:fs/promises';
import { projectPlanSchema } from '../plan.js';
import type { ProjectPlan } from '../plan.js';

export interface ProjectPlanWithSchema {
  plan: ProjectPlan;
  schemaComment?: string;
}

export class ManagedProjectPlan {
  constructor(
    public data: ProjectPlan,
    public path: string,
    public schemaComment?: string
  ) {}

  async update(updater: (data: ProjectPlan) => ProjectPlan) {
    this.data = updater(this.data);
    await this.save();
  }

  async refresh() {
    const result = await loadProjectPlan(this.path);
    this.data = result.plan;
    this.schemaComment = result.schemaComment;
  }

  async save() {
    let content = '';
    if (this.schemaComment) {
      content = `# ${this.schemaComment}\n`;
    }
    content += dump(this.data);
    await writeFile(this.path, content);
  }
}

/**
 * Load and parse the project plan from docs/plan.yml
 * @throws {Error} if file cannot be read or parsed
 * @throws {ZodError} if plan validation fails
 */
export async function loadProjectPlan(path: string): Promise<ProjectPlanWithSchema> {
  let fileContent: string;
  try {
    fileContent = await readFile(path, 'utf8');
  } catch (e) {
    const emptyPlan: ProjectPlanWithSchema = {
      plan: {
        plan: [],
        dependencies: [],
        notes: [],
      },
    };
    return emptyPlan;
  }

  try {
    // Extract any schema comment at the top of the file
    const fileLines: string[] = fileContent.split('\n');
    let schemaComment: string | undefined;
    let yamlStart = 0;

    // Look for comments at the start of the file
    while (yamlStart < fileLines.length && fileLines[yamlStart].trim().startsWith('#')) {
      const line = fileLines[yamlStart].trim().slice(1).trim();
      if (!schemaComment) {
        schemaComment = line;
      }
      yamlStart++;
    }

    // Join the remaining lines to parse as YAML
    const yamlContent = fileLines.slice(yamlStart).join('\n');
    const parsedYaml = load(yamlContent);
    return {
      plan: projectPlanSchema.parse(parsedYaml),
      schemaComment,
    };
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
export async function safeLoadProjectPlan(path: string): Promise<ProjectPlanWithSchema | null> {
  try {
    return await loadProjectPlan(path);
  } catch (error) {
    return null;
  }
}
