import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadProjectPlan,
  safeLoadProjectPlan,
  getNextIncompleteStory,
  getNextIncompleteSubtask,
  type ProjectPlan,
} from './plan.js';
import { readFile } from 'node:fs/promises';
import { load } from 'js-yaml';

// Mock fs and js-yaml
vi.mock('node:fs/promises');
vi.mock('js-yaml');

describe('plan-loader', () => {
  const mockPlan: ProjectPlan = {
    plan: [
      {
        title: 'Test Epic',
        focus: 'Test Focus',
        stories: [
          {
            title: 'Completed Story',
            completed: true,
            description: 'Test Description',
            testing: 'Test Testing',
            subtasks: [{ title: 'Subtask 1', completed: true }],
          },
          {
            title: 'Incomplete Story',
            completed: false,
            description: 'Test Description',
            testing: 'Test Testing',
            subtasks: [
              { title: 'Subtask 1', completed: true },
              { title: 'Subtask 2', completed: false },
            ],
          },
        ],
      },
    ],
    dependencies: ['Test Dependency'],
    notes: ['Test Note'],
  };

  beforeEach(() => {
    vi.mocked(readFile).mockResolvedValue('mock yaml content');
    vi.mocked(load).mockReturnValue(mockPlan);
  });

  it('should load and parse project plan', async () => {
    const plan = await loadProjectPlan('');
    expect(plan).toEqual(mockPlan);
  });

  it('should return null on error in safeLoadProjectPlan', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

    const plan = await safeLoadProjectPlan('');
    expect(plan).toBeNull();
  });

  it('should find next incomplete story', () => {
    const storyRef = getNextIncompleteStory(mockPlan);
    expect(storyRef).toEqual({ epic: 0, story: 1 });
  });

  it('should find next incomplete subtask', () => {
    const subtaskRef = getNextIncompleteSubtask(mockPlan);
    expect(subtaskRef).toEqual({ epic: 0, story: 1, subtask: 1 });
  });
});
