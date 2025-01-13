import { z } from 'zod';
import { join } from 'path';
import { EventEmitter } from 'node:events';
import { watch, type FileChangeInfo } from 'node:fs/promises';
import { scanProjectFiles } from './file_map';
import { projects, type Document } from '$lib/server/db/schema';
import { loadProjectPlan, ManagedProjectPlan } from './plan';
import { db } from '../server/db';
import { eq } from 'drizzle-orm';

/**
 * Zod schemas for project configuration structure
 */

export const technologySchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  documentation: z
    .union([z.string().url(), z.string().startsWith('./'), z.string().startsWith('../')])
    .optional(),
});

export const commandsConfigSchema = z.object({
  typecheck: z.string().optional(),
  lint: z.string().optional(),
  format: z.string().optional(),
  build: z.string().optional(),
  test: z.string().optional(),
  'test:unit': z.string().optional(),
  'test:e2e': z.string().optional(),
  'test:integration': z.string().optional(),
});

export const vcsConfigSchema = z.object({
  commitMessageTemplate: z.string().optional(),
  prTemplate: z.string().optional(),
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
      plan: z.string().optional(),
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
      externalDocs: z.array(z.string().url()).optional(),
    })
    .optional(),
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

export interface ProjectEvents {
  'docs:update': [string];
  error: [Error];
}

export class Project {
  docs: Map<string, Document> = new Map();
  knownDocs: Set<string> = new Set();
  events = new EventEmitter<ProjectEvents>();
  private watcherAbort: AbortController | null = null;

  constructor(
    public projectInfo: typeof projects.$inferSelect,
    public configFile: ProjectConfig,
    public plan: ManagedProjectPlan
  ) {}

  async init() {
    void this.startWatching();
  }

  async destroy() {
    this.stopWatching();
  }

  /** Get the absolute path to the docs directory */
  getDocsPath() {
    const docsPath = this.configFile.paths?.docs ?? 'docs';
    return join(this.projectInfo.path, docsPath);
  }

  /** Start watching the docs directory for changes */
  async startWatching() {
    if (this.watcherAbort) {
      return;
    }

    const docsPath = this.getDocsPath();
    this.watcherAbort = new AbortController();
    const watcher = watch(docsPath, {
      recursive: true,
      persistent: false,
      signal: this.watcherAbort.signal,
    });

    try {
      for await (const event of watcher) {
        // Rescan files and emit update event
        if (event.filename) {
          this.knownDocs.add(event.filename);
          this.events.emit('docs:update', event.filename);
        }
      }
    } catch (e) {
      // Watcher error
      this.events.emit('error', e as Error);
    }
  }

  /** Stop watching the docs directory */
  stopWatching() {
    this.watcherAbort?.abort();
    this.watcherAbort = null;
  }
}

export async function loadProject(id: number) {
  if (loadedProjects.has(id)) {
    return loadedProjects.get(id);
  }

  const projectInfo = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
  if (!projectInfo) {
    throw new Error(`Project ${id} not found`);
  }

  const projectConfig = await loadProjectConfig(join(projectInfo.path, 'project.yml'));
  if (!projectConfig) {
    throw new Error(`Project ${id} config not found`);
  }

  const projectPlanPath = join(projectInfo.path, projectConfig.paths?.plan || 'docs/plan.yml');
  const projectPlan = await loadProjectPlan(projectPlanPath);

  const managedPlan = new ManagedProjectPlan(projectPlan, projectPlanPath);
  const project = new Project(projectInfo, projectConfig, managedPlan);
  await project.init();

  loadedProjects.set(id, project);

  return project;
}

export const loadedProjects: Map<number, Project> = new Map();
