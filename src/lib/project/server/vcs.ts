import { stat } from 'node:fs/promises';
import { execa } from 'execa';
import path from 'node:path';

export async function isJujutsu(rootPath: string) {
  const jjPath = path.join(rootPath, '.jj');
  try {
    const f = await stat(jjPath);
    return f.isDirectory();
  } catch (e) {
    return false;
  }
}

export async function getVcs(rootPath: string): Promise<'jujutsu' | 'git'> {
  if (await isJujutsu(rootPath)) {
    return 'jujutsu';
  }
  return 'git';
}

export abstract class Vcs {
  constructor(
    public rootPath: string,
    public worktreeBasePath: string
  ) {}

  abstract createWorktree(name: string): Promise<string>;

  abstract removeWorktree(name: string): Promise<void>;

  abstract createBranch(name: string): Promise<string>;

  abstract getCurrentRef(): Promise<string>;

  abstract commit(message: string): Promise<void>;
}

export class GitVcs extends Vcs {
  async createWorktree(name: string) {
    const worktreePath = path.join(this.worktreeBasePath, name);
    await execa('git', ['worktree', 'add', worktreePath, await this.getCurrentRef()]);
    return worktreePath;
  }

  async removeWorktree(name: string) {
    const worktreePath = path.join(this.worktreeBasePath, name);
    await execa('git', ['worktree', 'remove', worktreePath]);
  }

  async getCurrentRef() {
    const ref = await execa('git', ['rev-parse', 'HEAD']);
    return ref.stdout.trim();
  }

  async createBranch(name: string) {
    await execa('git', ['branch', name]);
    return name;
  }

  async commit(message: string) {
    await execa('git', ['commit', '-m', message]);
  }
}

export class JujutsuVcs extends Vcs {
  async createWorktree(name: string) {
    const worktreePath = path.join(this.worktreeBasePath, name);
    await execa('jj', ['workspace', 'add', worktreePath, await this.getCurrentRef()]);
    return worktreePath;
  }

  async removeWorktree(name: string) {
    const worktreePath = path.join(this.worktreeBasePath, name);
    await execa('jj', ['workspace', 'forget', worktreePath]);
    await execa('rm', ['-rf', worktreePath]);
  }

  async getCurrentRef() {
    const ref = await execa('jj', [
      'log',
      '-r',
      '@',
      '--template',
      'change_id',
      '--no-graph',
      '--color',
      'never',
    ]);
    return ref.stdout.trim();
  }

  async createBranch(name: string) {
    await execa('jj', ['bookmark', 'create', name]);
    return name;
  }

  async commit(message: string) {
    const currentRef = await this.getCurrentRef();
    await execa('jj', ['commit', '-m', message]);
    await execa('jj', ['bookmark', 'move', '--from', currentRef]);
  }
}
