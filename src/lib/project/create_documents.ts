import { extractTag } from '$lib/llm';
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
  /** Name of the epic to create the planning document for */
  epicName: string;
  /** The LLM to use for generating the document */
  llm: LanguageModel;
}

export async function createEpicPlanning({ project, epicName, llm }: CreateEpicPlanningInput) {
  const epicTemplate = Handlebars.compile(
    await readFile(join(import.meta.dir, 'prompts/create_epic_document.md.hbs'), 'utf-8')
  );

  const info = await gatherProjectContext(project);

  const prompt = epicTemplate({
    PROJECT_OVERVIEW: info.projectOverview,
    EXISTING_FILES: info.scannedFiles,
    EPICS_STORIES_TASKS: info.plan,
    EPIC_NAME: epicName,
  });

  const response = await generateText({
    model: llm,
    prompt,
    temperature: 0.1,
  });

  const description = extractTag(response.text, 'epic_description');
  if (!description) {
    throw new Error('No epic description found in response');
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
      lines.push(`Focus: ${epic.focus}`);
      if (epic.plan_file) {
        lines.push(`Plan: ${epic.plan_file}`);
      }
    }
    lines.push('');

    epic.stories.forEach((story, storyIndex) => {
      const status = story.completed ? '[x]' : '[ ]';
      lines.push(`#### ${epicIndex + 1}.${storyIndex + 1}. ${status} ${story.title}`);

      if (story.description) {
        lines.push(story.description);
      }

      if (fullDetails) {
        if (story.plan_file) {
          lines.push(`Plan: ${story.plan_file}`);
        }
        if (story.testing) {
          lines.push(`Testing: ${story.testing}`);
        }
      }

      if (story.subtasks?.length) {
        lines.push('\nSubtasks:');
        story.subtasks.forEach((subtask, subtaskIndex) => {
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

  for (const area of areas) {
    lines.push(`## ${area}`);
    const areaFiles = filesByArea.get(area)!;

    // Sort files by path within each area
    areaFiles.sort((a, b) => a.path.localeCompare(b.path));

    for (const file of areaFiles) {
      if (file.description) {
        lines.push(`- \`${file.path}\` - ${file.description}`);
      } else {
        lines.push(`- \`${file.path}\``);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
