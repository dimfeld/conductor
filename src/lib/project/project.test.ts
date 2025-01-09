import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadProjectConfig,
  safeLoadProjectConfig,
  validateProjectConfig,
  type ProjectConfig,
} from './project.js';
import { readFile } from 'node:fs/promises';
import { load } from 'js-yaml';

// Mock fs and js-yaml
vi.mock('node:fs/promises');
vi.mock('js-yaml');

describe('project-config', () => {
  const mockConfig: ProjectConfig = {
    paths: {
      docs: 'docs',
      guidelines: 'guidelines.md',
      lessons: 'lessons.md',
      overview: 'overview.md',
      plan: 'plan.yml',
    },
    include: ['src/**/*.ts'],
    technologies: [
      {
        name: 'typescript',
        version: '5.0.0',
        documentation: 'https://www.typescriptlang.org/docs/',
      },
    ],
    commands: {
      typecheck: 'tsc --noEmit',
      test: 'vitest',
    },
  };

  beforeEach(() => {
    vi.mocked(readFile).mockResolvedValue('mock yaml content');
    vi.mocked(load).mockReturnValue(mockConfig);
  });

  it('should validate a valid project config', () => {
    const result = validateProjectConfig(mockConfig);
    expect(result).toEqual(mockConfig);
  });

  it('should load and parse project config', async () => {
    const config = await loadProjectConfig('project.yml');
    expect(config).toEqual(mockConfig);
  });

  it('should return null on error in safeLoadProjectConfig', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

    const config = await safeLoadProjectConfig('project.yml');
    expect(config).toBeNull();
  });

  it('should validate command structure', () => {
    const configWithInvalidCommand = {
      ...mockConfig,
      commands: {
        test: {
          // @ts-expect-error testing invalid command
          invalid: true,
        },
      },
    };

    expect(() => validateProjectConfig(configWithInvalidCommand)).toThrow();
  });

  it('should validate technology structure', () => {
    const configWithInvalidTech = {
      ...mockConfig,
      technologies: [
        {
          // @ts-expect-error testing invalid technology
          invalid: true,
        },
      ],
    };

    expect(() => validateProjectConfig(configWithInvalidTech)).toThrow();
  });
});
