import { generateText, tool } from 'ai';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { openrouterLlama318b } from '../llm';

function prompt(path: string, source: string) {
  return `You are an expert code analyst. Your task is to analyze a source code file and provide insights about its functionality and purpose. Here's the source code file you need to analyze:

<source_code filename="${path}">
${source}
</source_code>

Please follow these steps to analyze the code:

1. Carefully read through the entire source code.
2. Identify the primary functionality and purpose of the code.
3. Look for key components, libraries, or frameworks used in the code.
4. Determine the main area that the code best matches (e.g., authentication, database operations, file handling, etc.).
5. Formulate a concise one-sentence description of what the code does.
6. Develop a more detailed description (up to one paragraph) that includes:
   - The main functionality of the code
   - Any interesting or notable aspects of the implementation
   - Key interfaces or methods provided by the code
   - Potential use cases or applications of this code

After your analysis, provide your output in the following format:

<analysis>
<best_matching_area>
[Insert the area that best matches the code's functionality]
</best_matching_area>

<short_description>
[Insert a one-sentence description of what the code does]
</short_description>

<detailed_description>
[Insert a more detailed description, up to one paragraph, including the points mentioned in step 6]
</detailed_description>
</analysis>

Ensure that your analysis is accurate, concise, and provides valuable insights into the code's purpose and functionality.
`;
}

export const analyzeModel = openrouterLlama318b;

export async function analyzeScannedFile(path: string, projectPath: string) {
  const filePath = join(projectPath, path);
  const source = await readFile(filePath, 'utf-8');

  const response = await generateText({
    model: analyzeModel,
    prompt: prompt(path, source),
    temperature: 0.1,
  });

  const analysis = response.text;
  const bestMatchingArea = analysis.match(/<best_matching_area>(.*)<\/best_matching_area>/)?.[1];
  const shortDescription = analysis.match(/<short_description>(.*)<\/short_description>/)?.[1];
  const detailedDescription = analysis.match(
    /<detailed_description>(.*)<\/detailed_description>/
  )?.[1];

  console.log(`Analyzed file: ${filePath}, area: ${bestMatchingArea}, short: ${shortDescription}`);
  return {
    area: bestMatchingArea,
    shortDescription,
    longDescription: detailedDescription,
  };
}
