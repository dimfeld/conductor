import { anthropicClaude35Sonnet, extractTag } from '$lib/llm';
import { db } from '$lib/server/db';
import { scannedFiles } from '$lib/server/db/schema';
import { generateText, type LanguageModel } from 'ai';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import Handlebars from 'handlebars';
import { join } from 'path';
import type { Project } from './project.js';
import type { ManagedProjectPlan } from './server/plan.js';

interface CreateEpicPlanningInput {
  project: Project;
  /** Index of the epic to create the planning document for */
  epicIndex: number;
  /** Override the default LLM */
  llm?: LanguageModel;
}

async function readPromptFile(name: string, params: Record<string, string>) {
  const template = await readFile(
    join(import.meta.dirname, `prompts/planning/${name}.md.hbs`),
    'utf-8'
  );
  return Handlebars.compile(template)(params);
}

const planningModel = anthropicClaude35Sonnet;

export async function createEpicPlanning({ project, epicIndex, llm }: CreateEpicPlanningInput) {
  llm ??= planningModel;
  const info = await gatherProjectContext(project);
  const overviewPrompt = await readPromptFile('prefix_main', {
    PROJECT_OVERVIEW: info.projectOverview,
    EXISTING_FILES: info.scannedFiles,
    EPICS_STORIES_TASKS: info.plan,
  });

  const epicName = project.plan.data.plan[epicIndex].title;
  const epicPrompt = await readPromptFile('create_epic_document', {
    EPIC_NAME: epicName,
  });

  const response = await generateText({
    model: llm,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: overviewPrompt,
        experimental_providerMetadata: {
          anthropic: {
            cacheControl: { type: 'ephemeral' },
          },
        },
      },
      {
        role: 'user',
        content: epicPrompt,
      },
    ],
  });

  const description = extractTag(response.text, 'epic_description');
  if (!description) {
    throw new Error('No epic description found in response');
  }

  return description;
}

export interface CreateTaskPlanningInput extends CreateEpicPlanningInput {
  taskIndex: number;
}

export async function createTaskPlanning({
  project,
  epicIndex,
  taskIndex,
  llm,
}: CreateTaskPlanningInput) {
  llm ??= planningModel;
  const epic = project.plan.data.plan[epicIndex];

  if (!epic.plan_file) {
    throw new Error('Epic has no plan file');
  }

  const task = epic.tasks[taskIndex];
  const info = await gatherProjectContext(project);

  const overviewPrompt = await readPromptFile('prefix_main', {
    PROJECT_OVERVIEW: info.projectOverview,
    EXISTING_FILES: info.scannedFiles,
    EPICS_STORIES_TASKS: info.plan,
  });
  const epicDescription = await readPromptFile('prefix_epic_desc', {
    EPIC_NAME: epic.title,
    EPIC_PLANNING: await readFile(join(project.docsPath, epic.plan_file), 'utf-8'),
  });
  const taskPrompt = await readPromptFile('create_task_document', {
    TASK_NAME: task.title,
  });

  const response = await generateText({
    model: llm,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: overviewPrompt,
        experimental_providerMetadata: {
          anthropic: {
            cacheControl: { type: 'ephemeral' },
          },
        },
      },
      {
        role: 'user',
        content: epicDescription,
        experimental_providerMetadata: {
          anthropic: {
            cacheControl: { type: 'ephemeral' },
          },
        },
      },
      { role: 'user', content: taskPrompt },
    ],
  });

  const description = extractTag(response.text, 'task_description');
  if (!description) {
    throw new Error('No task description found in response');
  }

  return description;
}

export interface CreateSubtaskPlanningInput extends CreateTaskPlanningInput {
  subtaskIndex: number;
}

export async function createSubtaskPlanning({
  project,
  epicIndex,
  taskIndex,
  subtaskIndex,
  llm,
}: CreateSubtaskPlanningInput) {
  llm ??= planningModel;
  const epic = project.plan.data.plan[epicIndex];
  const task = epic.tasks[taskIndex];
  const subtask = task.subtasks?.[subtaskIndex];
  if (!subtask) {
    throw new Error('Subtask not found');
  }

  if (!epic.plan_file) {
    throw new Error('Epic has no plan file');
  }

  if (!task.plan_file) {
    throw new Error('Task has no plan file');
  }

  const info = await gatherProjectContext(project);
  const overviewPrompt = await readPromptFile('prefix_main', {
    PROJECT_OVERVIEW: info.projectOverview,
    EXISTING_FILES: info.scannedFiles,
    EPICS_STORIES_TASKS: info.plan,
  });
  const epicDescription = await readPromptFile('prefix_epic_desc', {
    EPIC_NAME: epic.title,
    EPIC_PLANNING: await readFile(join(project.docsPath, epic.plan_file), 'utf-8'),
  });
  const taskPrompt = await readPromptFile('prefix_task_desc', {
    TASK_NAME: task.title,
    TASK_PLANNING: await readFile(join(project.docsPath, task.plan_file), 'utf-8'),
  });
  const subtaskPrompt = await readPromptFile('create_subtask_document', {
    SUBTASK_NAME: subtask.title,
  });

  const response = await generateText({
    model: planningModel,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: overviewPrompt,
        experimental_providerMetadata: {
          anthropic: {
            cacheControl: { type: 'ephemeral' },
          },
        },
      },
      {
        role: 'user',
        content: epicDescription,
        experimental_providerMetadata: {
          anthropic: {
            cacheControl: { type: 'ephemeral' },
          },
        },
      },
      {
        role: 'user',
        content: taskPrompt,
        experimental_providerMetadata: {
          anthropic: {
            cacheControl: { type: 'ephemeral' },
          },
        },
      },
      { role: 'user', content: subtaskPrompt },
    ],
  });

  const description = extractTag(response.text, 'subtask_description');
  if (!description) {
    throw new Error('No task description found in response');
  }

  return description;
}

export async function gatherProjectContext(project: Project) {
  const projectOverviewPath = join(
    project.docsPath,
    project.configFile.paths?.overview || 'overview.md'
  );

  const projectOverview = await readFile(projectOverviewPath, 'utf-8');
  const plan = formatPlanForPrompt(project.plan);
  const scannedFiles = await formatScannedFiles(project.projectInfo.id);

  return {
    projectOverview,
    plan,
    scannedFiles,
  };
}

function formatPlanForPrompt(plan: ManagedProjectPlan, fullDetails = false) {
  const lines: string[] = [];
  lines.push('# Project Plan\n');

  // Add dependencies if they exist
  if (plan.data.dependencies?.length) {
    lines.push('## Dependencies');
    plan.data.dependencies.forEach((dep) => lines.push(`- ${dep}`));
    lines.push('');
  }

  // Add notes if they exist
  if (plan.data.notes?.length) {
    lines.push('## Notes');
    plan.data.notes.forEach((note) => lines.push(`- ${note}`));
    lines.push('');
  }

  // Add epics and their stories
  lines.push('## Epics');
  plan.data.plan.forEach((epic, epicIndex) => {
    lines.push(`### ${epicIndex + 1}. ${epic.title}`);
    if (fullDetails) {
      lines.push(`Description: ${epic.description}`);
      if (epic.plan_file) {
        lines.push(`Plan: ${epic.plan_file}`);
      }
    }
    lines.push('');

    epic.tasks.forEach((task, taskIndex) => {
      const status = task.completed ? '[x]' : '[ ]';
      lines.push(`#### ${epicIndex + 1}.${taskIndex + 1}. ${status} ${task.title}`);

      if (task.description) {
        lines.push(task.description);
      }

      if (fullDetails) {
        if (task.plan_file) {
          lines.push(`Plan: ${task.plan_file}`);
        }
        if (task.testing) {
          lines.push(`Testing: ${task.testing}`);
        }
      }

      if (task.subtasks?.length) {
        lines.push('\nSubtasks:');
        task.subtasks.forEach((subtask, subtaskIndex) => {
          const subtaskStatus = subtask.completed ? '[x]' : '[ ]';
          lines.push(`- ${subtaskStatus} ${subtask.title}`);
          if (fullDetails && subtask.plan_file) {
            lines.push(`  Plan: ${subtask.plan_file}`);
          }
        });
      }

      lines.push('');
    });
  });

  return lines.join('\n');
}

const defaultOmitPrefixes = ['src/lib/components/ui'];

/** Format scanned files into a brief markdown summary grouped by area */
export async function formatScannedFiles(
  projectId: number,
  omitPrefixes: string[] = defaultOmitPrefixes
) {
  const files = await db
    .select({
      path: scannedFiles.path,
      area: scannedFiles.area,
      description: scannedFiles.short_description,
    })
    .from(scannedFiles)
    .where(eq(scannedFiles.projectId, projectId));

  if (!files.length) {
    return '';
  }

  // Filter out files that match any of the prefixes
  const filteredFiles = files.filter(
    (file) => !omitPrefixes.some((prefix) => file.path.startsWith(prefix))
  );

  // Group files by area
  const filesByArea = new Map<string, typeof files>();
  for (const file of files) {
    const area = file.area || 'Uncategorized';
    const areaFiles = filesByArea.get(area) || [];
    areaFiles.push(file);
    filesByArea.set(area, areaFiles);
  }

  const lines: string[] = [];
  lines.push('# Project Files\n');

  // Sort areas alphabetically, but put Uncategorized at the end
  const areas = [...filesByArea.keys()].sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  const stripPrefix = /^(this|the) code (defines|exports|is)/i;

  for (const area of areas) {
    lines.push(`## ${area}`);
    const areaFiles = filesByArea.get(area)!;

    // Sort files by path within each area
    areaFiles.sort((a, b) => a.path.localeCompare(b.path));

    for (const file of areaFiles) {
      if (file.description) {
        let description = file.description.replace(stripPrefix, '');
        lines.push(`- \`${file.path}\` - ${description}`);
      } else {
        lines.push(`- \`${file.path}\``);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
