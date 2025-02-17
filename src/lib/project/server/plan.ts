import { dump, load } from 'js-yaml';
import { readFile, writeFile } from 'node:fs/promises';
import { watch } from 'node:fs';
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

  watchAbort: AbortController | undefined;

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

  watch() {
    this.watchAbort = new AbortController();
    watch(this.path, { signal: this.watchAbort.signal }, () => {
      this.refresh().catch(console.error);
    });
  }

  close() {
    this.watchAbort?.abort();
    this.watchAbort = undefined;
  }

  findEpic(id: number) {
    return this.data.plan.find((epic) => epic.id === id);
  }

  findTask(epicId: number, taskId: number) {
    return this.findEpic(epicId)?.tasks.find((task) => task.id === taskId);
  }

  findSubtask(epicId: number, taskId: number, subtaskId: number) {
    return this.findTask(epicId, taskId)?.subtasks?.find((subtask) => subtask.id === subtaskId);
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
      const storiesMax = epic.tasks.reduce((taskMax, task) => {
        const subtasksMax =
          task.subtasks?.reduce(
            (subtaskMax, subtask) => Math.max(subtaskMax, subtask.id ?? 0),
            0
          ) ?? 0;
        return Math.max(taskMax, task.id ?? 0, subtasksMax);
      }, 0);
      return Math.max(max, epicMax, storiesMax);
    }, 0);

    let nextId = maxId + 1;
    plan.plan = plan.plan.map((epic) => {
      if (epic.id === undefined) {
        epic.id = nextId++;
      }
      epic.tasks = epic.tasks.map((task) => {
        if (task.id === undefined) {
          task.id = nextId++;
        }
        if (task.subtasks) {
          task.subtasks = task.subtasks.map((subtask) => {
            if (subtask.id === undefined) {
              subtask.id = nextId++;
            }
            return subtask;
          });
        }
        return task;
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
    console.error(error);
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

export function generatePlanDocPath(type: string, task: { id: number; title: string }) {
  // Generate a filename based on the epic ID and title
  const truncatedTitle = task.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .split('_')
    .reduce((acc, word) => {
      if (!acc.length || acc.length + word.length + 1 <= 60) {
        return acc ? acc + '_' + word : word;
      }
      return acc;
    }, '');
  return `tasks/${task.id.toString().padStart(5, '0')}_${type}_${truncatedTitle}.md`;
}
