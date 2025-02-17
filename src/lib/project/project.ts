import { join, relative } from 'path';
import { EventEmitter } from 'node:events';
import { access, readFile, watch, writeFile } from 'node:fs/promises';
import { projects } from '$lib/server/db/schema';
import { loadProjectPlan, ManagedProjectPlan } from './server/plan';
import { dump, load } from 'js-yaml';
import { db } from '../server/db';
import { eq } from 'drizzle-orm';
import { globby } from 'globby';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { inferProjectLanguages, jsPackageManager } from './infer_project_settings.js';
import { scanProjectFiles } from './file_map.js';
import { projectConfigSchema } from './projectConfigSchema.js';
import { type ProjectConfig } from './projectConfigSchema.js';

export * from './projectConfigSchema.js';

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

  return projectConfigSchema.parse(parsedYaml);
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

  async scanProjectFiles() {
    await scanProjectFiles({
      projectId: this.projectInfo.id,
      projectRoot: this.projectInfo.path,
      include: this.configFile.include,
      exclude: this.configFile.exclude ?? [],
    });
  }

  /** Start watching the docs directory for changes */
  async startWatching() {
    if (this.watcherAbort) {
      return;
    }

    // TODO Also watch project and plan config files and reload them

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

  const managedPlan = new ManagedProjectPlan(projectPlan);
  managedPlan.watch();
  const project = new Project(projectInfo, projectConfig, managedPlan);
  await project.init();

  loadedProjects.set(id, project);

  return project;
}

export const loadedProjects: Map<number, Project> = new Map();
