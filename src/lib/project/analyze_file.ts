import { generateText, tool } from 'ai';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { openrouterLlama318b } from '../llm';

function prompt(source: string) {
  return `You are an expert code analyst. Your task is to analyze a source code file and provide insights about its functionality and purpose. Here's the source code file you need to analyze:

<source_code>
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

Ensure that your analysis is accurate, concise, and provides valuable insights into the code's purpose and functionality.
`;
}

export const analyzeModel = openrouterLlama318b;

export async function analyzeScannedFile(path: string, projectPath: string) {
  const filePath = join(projectPath, path);
  const source = await readFile(filePath, 'utf-8');

  const response = await generateText({
    model: analyzeModel,
    prompt: prompt(source),
    temperature: 0.1,
    toolChoice: 'required',
    tools: {
      analyzeCode: tool({
        description: 'Analyze the code and provide a detailed description of its functionality',
        parameters: z.object({
          best_matching_area: z
            .string()
            .describe(
              "The area that best matches the code's functionality, such as database, auth, or file import"
            ),
          short_description: z
            .string()
            .describe('A one-sentence description of what the code does'),
          detailed_description: z
            .string()
            .describe(
              'A more detailed description, up to one paragraph, including the points mentioned in step 6'
            ),
        }),
      }),
    },
  });

  const toolCall = response.toolCalls[0];

  console.log('Analyzed file:', filePath, toolCall.args);
  return {
    area: toolCall.args.best_matching_area,
    shortDescription: toolCall.args.short_description,
    longDescription: toolCall.args.detailed_description,
  };
}
