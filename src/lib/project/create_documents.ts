import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import { join } from 'path';
import { generateText, type LanguageModel } from 'ai';
import { extractTag } from '$lib/llm';

const epicTemplate = Handlebars.compile(
  readFileSync(join(process.cwd(), 'src/lib/project/prompts/create_epic_document.md.hbs'), 'utf-8')
);

interface CreateEpicPlanningInput {
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
  projectOverview,
  existingFiles,
  epicsStoriesTasks,
  epicName,
  llm,
}: CreateEpicPlanningInput) {
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
