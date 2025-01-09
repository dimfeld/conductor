import { MarkdownService } from './markdown';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile, writeFile, access } from 'node:fs/promises';

vi.mock('node:fs/promises', async (importOriginal) => ({
  ...(await importOriginal()),
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

describe('MarkdownService', () => {
  const mockRepoPath = '/mock/repo/path';
  let service: MarkdownService;

  beforeEach(() => {
    service = new MarkdownService(mockRepoPath);
    vi.clearAllMocks();

    // Reset mock implementations
    vi.mocked(access).mockImplementation(async (path) => {
      if (path === '/mock/repo/path/docs/plan.md') {
        return Promise.resolve();
      }
      throw new Error('File not found');
    });

    vi.mocked(readFile).mockImplementation(async (path) => {
      if (path === '/mock/repo/path/docs/plan.md') {
        return Promise.resolve('# Test Content');
      }
      throw new Error('Read error');
    });

    vi.mocked(writeFile).mockImplementation(async (path) => {
      if (path === '/mock/repo/path/docs/plan.md') {
        return Promise.resolve();
      }
      throw new Error('Write error');
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      const exists = await service.fileExists();
      expect(exists).toBe(true);
      expect(access).toHaveBeenCalledWith('/mock/repo/path/docs/plan.md');
    });

    it('should return false when file does not exist', async () => {
      vi.mocked(access).mockImplementationOnce(() => Promise.reject(new Error('File not found')));
      const exists = await service.fileExists();
      expect(exists).toBe(false);
      expect(access).toHaveBeenCalledWith('/mock/repo/path/docs/plan.md');
    });
  });

  describe('readTasks', () => {
    it('should return empty content when file does not exist', async () => {
      vi.mocked(access).mockRejectedValue(new Error('File not found'));
      const result = await service.readTasks();
      expect(result).toEqual({ content: '', exists: false });
    });

    it('should read markdown file successfully', async () => {
      const mockContent = '# Test Content';
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockResolvedValue(mockContent);

      const result = await service.readTasks();
      expect(result).toEqual({ content: mockContent, exists: true });
      expect(readFile).toHaveBeenCalledWith(mockRepoPath + '/docs/plan.md', 'utf-8');
    });

    it('should throw error when file exists but cannot be read', async () => {
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(readFile).mockRejectedValue(new Error('Read error'));

      await expect(service.readTasks()).rejects.toThrow('Failed to read markdown file: Read error');
    });
  });

  describe('writeTasks', () => {
    it('should write markdown file successfully', async () => {
      const mockContent = '# Test Content';
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await expect(service.writeTasks(mockContent)).resolves.not.toThrow();
      expect(writeFile).toHaveBeenCalledWith(mockRepoPath + '/docs/plan.md', mockContent, 'utf-8');
    });

    it('should throw error when file write fails', async () => {
      vi.mocked(writeFile).mockRejectedValue(new Error('Write error'));

      await expect(service.writeTasks('content')).rejects.toThrow(
        'Failed to write markdown file: Write error'
      );
    });
  });
});
