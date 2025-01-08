import { z } from 'zod';

/**
 * Zod schemas for project configuration structure
 */

export const technologySchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  documentation: z
    .union([z.string().url(), z.string().startsWith('./'), z.string().startsWith('../')])
    .optional()
});

export const commandsConfigSchema = z.object({
  typecheck: z.string().optional(),
  lint: z.string().optional(),
  format: z.string().optional(),
  build: z.string().optional(),
  test: z.string().optional(),
  'test:unit': z.string().optional(),
  'test:e2e': z.string().optional(),
  'test:integration': z.string().optional()
});

export const vcsConfigSchema = z.object({
  commitMessageTemplate: z.string().optional(),
  prTemplate: z.string().optional()
});

export const projectConfigSchema = z.object({
  // Core paths
  paths: z
    .object({
      docs: z.string().optional(),

      // Optional custom paths for standard docs
      guidelines: z.string().optional(),
      lessons: z.string().optional(),
      overview: z.string().optional(),
      plan: z.string().optional()
    })
    .optional(),

  include: z.array(z.string()).describe('Glob for files to include in project'),
  exclude: z.array(z.string()).optional().describe('Glob for files to exclude from project'),

  // Project requirements and tooling
  technologies: z.array(technologySchema),
  commands: commandsConfigSchema,
  vcs: vcsConfigSchema.optional(),

  // Documentation and context
  documentation: z
    .object({
      // Additional documentation files to always include in context
      contextFiles: z.array(z.string()).optional(),
      // API documentation location
      apiDocs: z.string().optional(),
      // Additional documentation URLs
      externalDocs: z.array(z.string().url()).optional()
    })
    .optional()
});

// Infer TypeScript types from the Zod schemas
export type Technology = z.infer<typeof technologySchema>;
export type CommandsConfig = z.infer<typeof commandsConfigSchema>;
export type VCSConfig = z.infer<typeof vcsConfigSchema>;
export type ProjectConfig = z.infer<typeof projectConfigSchema>;

/**
 * Validate a project configuration object
 * @throws {ZodError} if validation fails
 */
export function validateProjectConfig(config: unknown): ProjectConfig {
  return projectConfigSchema.parse(config);
}

/**
 * Safe version of validateProjectConfig that returns null instead of throwing
 */
export function safeValidateProjectConfig(config: unknown): ProjectConfig | null {
  const result = projectConfigSchema.safeParse(config);
  return result.success ? result.data : null;
}

/**
 * Load and parse the project configuration
 * @throws {Error} if file cannot be read or parsed
 * @throws {ZodError} if config validation fails
 */
export async function loadProjectConfig(path: string): Promise<ProjectConfig> {
  try {
    const { readFile } = await import('node:fs/promises');
    const { load } = await import('js-yaml');

    const yamlContent = await readFile(path, 'utf8');
    const parsedYaml = load(yamlContent);

    return projectConfigSchema.parse(parsedYaml);
  } catch (error) {
    if (error instanceof Error) {
      error.message = `Failed to load project config: ${error.message}`;
    }
    throw error;
  }
}

/**
 * Safe version of loadProjectConfig that returns null instead of throwing
 */
export async function safeLoadProjectConfig(path: string): Promise<ProjectConfig | null> {
  try {
    return await loadProjectConfig(path);
  } catch (error) {
    return null;
  }
}
