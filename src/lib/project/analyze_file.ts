import { generateText, tool } from 'ai';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { extractTag, extractTags, openrouterLlama318b } from '../llm';
import Handlebars from 'handlebars';
const { compile } = Handlebars;

export const analyzeModel = openrouterLlama318b;

export async function analyzeScannedFile(path: string, projectPath: string) {
  const filePath = join(projectPath, path);
  const source = await readFile(filePath, 'utf-8');

  const template = await readFile(join(import.meta.dir, 'prompts/analyze_file.md.hbs'), 'utf-8');
  const prompt = compile(template, { strict: true })({ path, source });

  console.log('Analyzing file', path);

  const response = await generateText({
    model: analyzeModel,
    prompt,
    temperature: 0.1,
  });

  const analysis = response.text;
  const {
    best_matching_area: area,
    short_description: shortDescription,
    detailed_description: longDescription,
  } = extractTags(analysis, ['best_matching_area', 'short_description', 'detailed_description']);

  console.log(`Analyzed file: ${filePath}, area: ${area}, short: ${shortDescription}`);

  if (!area || !shortDescription || !longDescription) {
    console.error('No area or short description found for file', path);
    console.error(response.text);
    // TODO We should actually retry this or something
    return;
  }

  return {
    area,
    shortDescription,
    longDescription,
  };
}
