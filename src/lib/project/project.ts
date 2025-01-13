import { z } from 'zod';
import { join, relative } from 'path';
import { EventEmitter } from 'node:events';
import { access, readFile, watch, writeFile } from 'node:fs/promises';
import { projects, type Document } from '$lib/server/db/schema';
import { loadProjectPlan, ManagedProjectPlan } from './server/plan';
import { dump, load } from 'js-yaml';
import { db } from '../server/db';
import { eq } from 'drizzle-orm';
import { globby } from 'globby';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { inferProjectLanguages, jsPackageManager } from './infer_project_settings.js';

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
  generate_types: z.string().optional(),
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
export async function loadProjectConfig(
  event: RequestEvent | Cookies,
  path: string
): Promise<ProjectConfig> {
  let parsedYaml: any;
  try {
    const yamlContent = await readFile(path, 'utf8');
    parsedYaml = load(yamlContent);
  } catch (e) {
    const tech = await inferProjectLanguages(path);
    const packageManager =
      tech.includes('javascript') || tech.includes('typescript')
        ? await jsPackageManager(path)
        : undefined;

    if (packageManager) {
      tech.push(packageManager);
    }

    const defaultProjectConfig: ProjectConfig = {
      paths: {
        docs: 'docs',
        guidelines: 'guidelines.md',
        lessons: 'lessons.md',
        overview: 'overview.md',
        plan: 'plan.yml',
      },
      include: [],
      exclude: [],
      technologies: tech.map((language) => ({ name: language })),
      commands: {},
    };

    await writeFile(path, dump(defaultProjectConfig));

    setFlash(
      {
        type: 'info',
        message: `Created project config file ${path}`,
      },
      event
    );

    parsedYaml = defaultProjectConfig;
  }

  try {
    return projectConfigSchema.parse(parsedYaml);
  } catch (error) {
    if (error instanceof Error) {
      error.message = `Failed to load project config: ${error.message}`;
    }
    throw error;
  }
}

function docsPath(projectInfo: typeof projects.$inferSelect, projectConfig: ProjectConfig) {
  return join(projectInfo.path, projectConfig.paths?.docs || 'docs');
}

function planPath(projectInfo: typeof projects.$inferSelect, projectConfig: ProjectConfig) {
  return join(docsPath(projectInfo, projectConfig), projectConfig.paths?.plan || 'plan.yml');
}

export interface ProjectEvents {
  'docs:added': [string];
  'docs:removed': [string];
  error: [Error];
}

export class Project {
  /** All the documents, including untracked ones */
  allDocs: Set<string> = new Set();
  events = new EventEmitter<ProjectEvents>();
  private watcherAbort: AbortController | null = null;

  constructor(
    public projectInfo: typeof projects.$inferSelect,
    public configFile: ProjectConfig,
    public plan: ManagedProjectPlan
  ) {}

  async init() {
    void this.startWatching();
    await this.scanDocsPath();
  }

  async destroy() {
    this.stopWatching();
  }

  /** Get the absolute path to the docs directory */
  get docsPath() {
    return docsPath(this.projectInfo, this.configFile);
  }

  get planPath() {
    return planPath(this.projectInfo, this.configFile);
  }

  async scanDocsPath() {
    const docsPath = this.docsPath;
    const docs = await globby('**/*.md', { cwd: docsPath });
    for (const doc of docs) {
      this.allDocs.add(doc);
    }
  }

  /** Start watching the docs directory for changes */
  async startWatching() {
    if (this.watcherAbort) {
      return;
    }

    const docsPath = this.docsPath;
    this.watcherAbort = new AbortController();
    const watcher = watch(docsPath, {
      recursive: true,
      persistent: false,
      signal: this.watcherAbort.signal,
    });

    try {
      for await (const event of watcher) {
        // Rescan files and emit update event
        if (event.eventType === 'rename' && event.filename) {
          try {
            await access(event.filename);
            if (!this.allDocs.has(event.filename)) {
              this.allDocs.add(event.filename);
              this.events.emit('docs:added', relative(docsPath, event.filename));
            }
          } catch (e) {
            // File was deleted
            if (this.allDocs.has(event.filename)) {
              this.allDocs.delete(event.filename);
              this.events.emit('docs:removed', relative(docsPath, event.filename));
            }
          }
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

export async function loadProject(event: RequestEvent | Cookies, id: number) {
  if (loadedProjects.has(id)) {
    return loadedProjects.get(id);
  }

  const projectInfo = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
  if (!projectInfo) {
    throw new Error(`Project ${id} not found`);
  }

  const projectConfig = await loadProjectConfig(event, join(projectInfo.path, 'project.yml'));
  if (!projectConfig) {
    throw new Error(`Project ${id} config not found`);
  }

  const projectPlanPath = planPath(projectInfo, projectConfig);
  const projectPlan = await loadProjectPlan(projectPlanPath);

  const managedPlan = new ManagedProjectPlan(projectPlan, projectPlanPath);
  const project = new Project(projectInfo, projectConfig, managedPlan);
  await project.init();

  loadedProjects.set(id, project);

  return project;
}

export const loadedProjects: Map<number, Project> = new Map();
