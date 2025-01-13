import * as path from 'path';
import * as fs from 'fs/promises';

function exists(path: string) {
  return fs
    .access(path)
    .then(() => true)
    .catch(() => false);
}

// TODO This works for a single-package repo but probably doesn't work in all
// multi-package monorepo cases.
export async function inferProjectLanguages(baseDir: string): Promise<string[]> {
  const languageChecks = await Promise.all([
    exists(path.join(baseDir, 'package.json')).then((exists) => (exists ? 'javascript' : null)),
    exists(path.join(baseDir, 'tsconfig.json')).then((exists) => (exists ? 'typescript' : null)),

    Promise.all([
      exists(path.join(baseDir, 'svelte.config.js')),
      exists(path.join(baseDir, 'svelte.config.ts')),
    ]).then(([svelteJsExists, svelteTsExists]) =>
      svelteJsExists || svelteTsExists ? 'svelte' : null
    ),

    exists(path.join(baseDir, 'go.mod')).then((exists) => (exists ? 'go' : null)),
    exists(path.join(baseDir, 'pom.xml')).then((exists) => (exists ? 'java' : null)),

    Promise.all([
      exists(path.join(baseDir, 'requirements.txt')),
      exists(path.join(baseDir, 'pyproject.toml')),
    ]).then(([reqExists, pyExists]) => (reqExists || pyExists ? 'python' : null)),

    exists(path.join(baseDir, 'Cargo.toml')).then((exists) => (exists ? 'rust' : null)),
  ]);

  return languageChecks.filter((language) => language !== null);
}

export async function jsPackageManager(baseDir: string) {
  if (await exists(path.join(baseDir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await exists(path.join(baseDir, 'bun.lockb'))) {
    return 'bun';
  }
  if (await exists(path.join(baseDir, 'package-lock.json'))) {
    return 'npm';
  }
  if (await exists(path.join(baseDir, 'yarn.lock'))) {
    return 'yarn';
  }
  return null;
}
