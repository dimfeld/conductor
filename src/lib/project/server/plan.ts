import { dump, load } from 'js-yaml';
import { readFile, writeFile } from 'node:fs/promises';
import { projectPlanSchema } from '../plan.js';
import type { ProjectPlan } from '../plan.js';

export interface LoadedProjectPlan {
  plan: ProjectPlan;
  path: string;
  schemaComment?: string;
  nextId: number;
}

export class ManagedProjectPlan {
  data: ProjectPlan;
  schemaComment?: string;
  nextId: number;
  path: string;

  constructor(loadedPlan: LoadedProjectPlan) {
    this.data = loadedPlan.plan;
    this.schemaComment = loadedPlan.schemaComment;
    this.nextId = loadedPlan.nextId;
    this.path = loadedPlan.path;
  }

  async update(updater: (data: ProjectPlan) => ProjectPlan) {
    this.data = updater(this.data);
    await this.save();
  }

  async refresh() {
    const result = await loadProjectPlan(this.path);
    this.data = result.plan;
    this.schemaComment = result.schemaComment;
    this.nextId = result.nextId;
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
export async function loadProjectPlan(path: string): Promise<LoadedProjectPlan> {
  let fileContent: string;
  try {
    fileContent = await readFile(path, 'utf8');
  } catch (e) {
    const emptyPlan: LoadedProjectPlan = {
      path,
      plan: {
        plan: [],
        dependencies: [],
        notes: [],
      },
      nextId: 1,
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

    let plan = projectPlanSchema.parse(parsedYaml);

    const maxId = plan.plan.reduce((max, epic) => {
      const epicMax = epic.id ?? 0;
      const storiesMax = epic.stories.reduce((storyMax, story) => {
        const subtasksMax =
          story.subtasks?.reduce(
            (subtaskMax, subtask) => Math.max(subtaskMax, subtask.id ?? 0),
            0
          ) ?? 0;
        return Math.max(storyMax, story.id ?? 0, subtasksMax);
      }, 0);
      return Math.max(max, epicMax, storiesMax);
    }, 0);

    let nextId = maxId + 1;
    plan.plan = plan.plan.map((epic) => {
      if (epic.id === undefined) {
        epic.id = nextId++;
      }
      epic.stories = epic.stories.map((story) => {
        if (story.id === undefined) {
          story.id = nextId++;
        }
        if (story.subtasks) {
          story.subtasks = story.subtasks.map((subtask) => {
            if (subtask.id === undefined) {
              subtask.id = nextId++;
            }
            return subtask;
          });
        }
        return story;
      });
      return epic;
    });

    return {
      plan,
      path,
      schemaComment,
      nextId,
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
export async function safeLoadProjectPlan(path: string): Promise<LoadedProjectPlan | null> {
  try {
    return await loadProjectPlan(path);
  } catch (error) {
    return null;
  }
}
