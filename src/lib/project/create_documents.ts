import { readFile } from 'fs/promises';
import Handlebars from 'handlebars';
import { join } from 'path';
import { generateText, type LanguageModel } from 'ai';
import { extractTag } from '$lib/llm';
import type { Project } from './project.js';
import type { ManagedProjectPlan } from './server/plan.js';

interface CreateEpicPlanningInput {
  project: Project;
  /** Overview of the project and its goals */
  projectOverview: string;
  /** Information about existing files in the project */
  existingFiles: string;
  /** Description of all epics, stories, and tasks */
  epicsStoriesTasks: string;
  /** Name of the epic to create the planning document for */
  epicName: string;
  /** The LLM to use for generating the document */
  llm: LanguageModel;
}

export async function createEpicPlanning({
  project,
  projectOverview,
  existingFiles,
  epicsStoriesTasks,
  epicName,
  llm,
}: CreateEpicPlanningInput) {
  const epicTemplate = Handlebars.compile(
    await readFile(join(import.meta.dir, 'prompts/create_epic_document.md.hbs'), 'utf-8')
  );

  const prompt = epicTemplate({
    PROJECT_OVERVIEW: projectOverview,
    EXISTING_FILES: existingFiles,
    EPICS_STORIES_TASKS: epicsStoriesTasks,
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
  const planDoc = formatPlanForPrompt(project.plan);
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
