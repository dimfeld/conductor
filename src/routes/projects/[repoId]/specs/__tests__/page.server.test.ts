import { describe, test, expect, vi, beforeEach } from 'vitest';
import { load } from '../+page.server';
import * as config from '$lib/config';
import fs from 'fs';
import path from 'path';

// Mock dependencies
vi.mock('$lib/config', () => ({
  loadConfig: vi.fn()
}));

vi.mock('fs', () => {
  return {
    default: {
      readdirSync: vi.fn()
    },
    readdirSync: vi.fn()
  };
});

vi.mock('path', () => {
  return {
    default: {
      join: vi.fn((...args) => args.join('/'))
    },
    join: vi.fn((...args) => args.join('/'))
  };
});

describe('Specs Page Server Load', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('should return spec files for a valid repository', async () => {
    // Mock repository in config
    vi.mocked(config.loadConfig).mockReturnValue({
      repositories: [
        { id: 'repo1', path: '/path/to/repo1' }
      ]
    });

    // Mock fs.readdirSync to return some YAML files
    vi.mocked(fs.readdirSync).mockReturnValue(['spec1.yaml', 'spec2.yaml', 'not-a-spec.txt'] as unknown as fs.Dirent[]);

    const result = await load({ params: { repoId: 'repo1' } } as any);

    // Check path.join was called correctly
    expect(path.join).toHaveBeenCalledWith('/path/to/repo1', 'specs');
    
    // Check fs.readdirSync was called
    expect(fs.readdirSync).toHaveBeenCalled();
    
    // Check that only YAML files are returned
    expect(result).toEqual({
      specFiles: ['spec1.yaml', 'spec2.yaml']
    });
  });

  test('should throw 404 for non-existent repository', async () => {
    // Mock empty repositories in config
    vi.mocked(config.loadConfig).mockReturnValue({
      repositories: [
        { id: 'repo1', path: '/path/to/repo1' }
      ]
    });

    // Expect error to be thrown for non-existent repo
    await expect(load({ params: { repoId: 'non-existent' } } as any))
      .rejects.toMatchObject({
        status: 404
      });
    
    // Verify fs was not called
    expect(fs.readdirSync).not.toHaveBeenCalled();
  });

  test('should return empty array if specs directory does not exist', async () => {
    // Mock repository in config
    vi.mocked(config.loadConfig).mockReturnValue({
      repositories: [
        { id: 'repo1', path: '/path/to/repo1' }
      ]
    });

    // Mock fs.readdirSync to throw ENOENT error
    const error = new Error('Directory not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw error;
    });

    const result = await load({ params: { repoId: 'repo1' } } as any);

    // Check that an empty array is returned
    expect(result).toEqual({
      specFiles: []
    });
  });
});