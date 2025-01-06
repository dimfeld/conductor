import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

export interface TaskMarkdown {
  content: string;
  exists: boolean;
}

export class MarkdownService {
  private filePath: string;

  constructor(repoPath: string) {
    this.filePath = join(repoPath, 'docs/plan.md');
  }

  /**
   * Checks if the markdown file exists
   * @returns Promise<boolean> true if file exists
   */
  async fileExists(): Promise<boolean> {
    try {
      await access(this.filePath);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Reads tasks from markdown file
   * @returns Promise<TaskMarkdown> containing file content and existence status
   * @throws Error if file exists but cannot be read
   */
  async readTasks(): Promise<TaskMarkdown> {
    const exists = await this.fileExists();
    if (!exists) {
      return { content: '', exists: false };
    }

    try {
      const content = await readFile(this.filePath, 'utf-8');
      return { content, exists: true };
    } catch (error) {
      throw new Error(`Failed to read markdown file: ${error.message}`);
    }
  }

  /**
   * Writes tasks to markdown file
   * @param content Markdown content to write
   * @throws Error if file cannot be written
   */
  async writeTasks(content: string): Promise<void> {
    try {
      await writeFile(this.filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write markdown file: ${error.message}`);
    }
  }
}
