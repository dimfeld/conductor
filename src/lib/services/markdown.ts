import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export class MarkdownService {
  private filePath: string;

  constructor(repoPath: string) {
    this.filePath = join(repoPath, 'docs/plan.md');
  }

  async readTasks(): Promise<string> {
    try {
      return await readFile(this.filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read markdown file: ${error.message}`);
    }
  }

  async writeTasks(content: string): Promise<void> {
    try {
      await writeFile(this.filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write markdown file: ${error.message}`);
    }
  }
}
