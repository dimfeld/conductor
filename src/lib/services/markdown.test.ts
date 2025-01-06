import { MarkdownService } from './markdown';
import { describe, it, expect, vi } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';

describe('MarkdownService', () => {
  const mockRepoPath = '/mock/repo/path';
  const service = new MarkdownService(mockRepoPath);

  describe('readTasks', () => {
    it('should read markdown file successfully', async () => {
      const mockContent = '# Test Content';
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const content = await service.readTasks();
      expect(content).toBe(mockContent);
    });

    it('should throw error when file read fails', async () => {
      vi.mocked(readFile).mockRejectedValue(new Error('Read error'));
      
      await expect(service.readTasks()).rejects.toThrow('Failed to read markdown file: Read error');
    });
  });

  describe('writeTasks', () => {
    it('should write markdown file successfully', async () => {
      const mockContent = '# Test Content';
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await expect(service.writeTasks(mockContent)).resolves.not.toThrow();
    });

    it('should throw error when file write fails', async () => {
      vi.mocked(writeFile).mockRejectedValue(new Error('Write error'));
      
      await expect(service.writeTasks('content')).rejects.toThrow('Failed to write markdown file: Write error');
    });
  });
});
