import { describe, test, expect } from 'vitest';
import { specSchema } from './specSchema';

describe('specSchema', () => {
  test('validates a valid spec', () => {
    const validSpec = {
      specName: 'Test Spec',
      objective: 'Test objective for the spec',
      implementation: ['Step 1', 'Step 2'],
      tasks: [
        {
          name: 'Task 1',
          prompt: 'Do something for task 1',
          evaluation: 'Check that task 1 was completed correctly'
        }
      ],
      aider: {
        model: 'gpt-4',
        architect: true,
        editable_files: ['src/file1.ts', 'src/file2.ts'],
        readonly_files: ['test/fixtures/data.json']
      }
    };
    
    const result = specSchema.safeParse(validSpec);
    expect(result.success).toBe(true);
  });
  
  test('validates a minimal valid spec', () => {
    const minimalSpec = {
      specName: 'Minimal Spec',
      objective: 'Minimal objective',
      implementation: [],
      tasks: [
        {
          name: 'Task 1',
          prompt: 'Do something'
        }
      ]
    };
    
    const result = specSchema.safeParse(minimalSpec);
    expect(result.success).toBe(true);
  });
  
  test('rejects spec without a name', () => {
    const invalidSpec = {
      specName: '',  // Empty name
      objective: 'Test objective',
      implementation: [],
      tasks: [
        {
          name: 'Task 1',
          prompt: 'Do something'
        }
      ]
    };
    
    const result = specSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Spec name is required');
    }
  });
  
  test('rejects spec without an objective', () => {
    const invalidSpec = {
      specName: 'Test Spec',
      objective: '',  // Empty objective
      implementation: [],
      tasks: [
        {
          name: 'Task 1',
          prompt: 'Do something'
        }
      ]
    };
    
    const result = specSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Objective is required');
    }
  });
  
  test('rejects spec without tasks', () => {
    const invalidSpec = {
      specName: 'Test Spec',
      objective: 'Test objective',
      implementation: [],
      tasks: []  // Empty tasks array
    };
    
    const result = specSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('At least one task is required');
    }
  });
  
  test('rejects tasks without a name', () => {
    const invalidSpec = {
      specName: 'Test Spec',
      objective: 'Test objective',
      implementation: [],
      tasks: [
        {
          name: '',  // Empty task name
          prompt: 'Do something'
        }
      ]
    };
    
    const result = specSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Task name is required');
    }
  });
  
  test('rejects tasks without a prompt', () => {
    const invalidSpec = {
      specName: 'Test Spec',
      objective: 'Test objective',
      implementation: [],
      tasks: [
        {
          name: 'Task 1',
          prompt: ''  // Empty prompt
        }
      ]
    };
    
    const result = specSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Task prompt is required');
    }
  });
  
  test('allows optional aider configuration', () => {
    const validSpec = {
      specName: 'Test Spec',
      objective: 'Test objective',
      implementation: [],
      tasks: [
        {
          name: 'Task 1',
          prompt: 'Do something'
        }
      ],
      aider: {
        model: 'gpt-3.5-turbo'  // Only providing model
      }
    };
    
    const result = specSchema.safeParse(validSpec);
    expect(result.success).toBe(true);
  });
});