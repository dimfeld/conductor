/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Page from '../+page.svelte';
import { goto } from '$app/navigation';

// Mock navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// Mock page store
vi.mock('$app/stores', () => {
  const { readable } = require('svelte/store');
  return {
    page: readable({ params: { repoId: 'test-repo' } })
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('New Spec Form', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock implementation for fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });
  });

  test('renders form with all fields', () => {
    render(Page);
    
    // Check headings
    expect(screen.getByText('Create New Spec - test-repo')).toBeInTheDocument();
    
    // Check main form fields
    expect(screen.getByLabelText('Spec Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Objective')).toBeInTheDocument();
    expect(screen.getByLabelText('Implementation Steps')).toBeInTheDocument();
    
    // Check task fields
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByLabelText('Task Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Task Prompt')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.getByText('Create Spec')).toBeInTheDocument();
  });

  test('adding and removing tasks works', async () => {
    render(Page);
    
    // Initially should have one task
    expect(screen.getAllByText(/Task \d+/).length).toBe(1);
    
    // Click 'Add Task' button
    const addButton = screen.getByText('Add Task');
    await fireEvent.click(addButton);
    
    // Should now have two tasks
    expect(screen.getAllByText(/Task \d+/).length).toBe(2);
    
    // Remove buttons should be visible when there are multiple tasks
    const removeButtons = screen.getAllByText('Remove');
    expect(removeButtons.length).toBe(2);
    
    // Click first remove button
    await fireEvent.click(removeButtons[0]);
    
    // Should now have one task again
    expect(screen.getAllByText(/Task \d+/).length).toBe(1);
  });

  test('submits form with valid data', async () => {
    render(Page);
    
    // Fill form fields
    await fireEvent.input(screen.getByLabelText('Spec Name'), { 
      target: { value: 'Test Spec' } 
    });
    
    await fireEvent.input(screen.getByLabelText('Objective'), { 
      target: { value: 'Test objective' } 
    });
    
    await fireEvent.input(screen.getByLabelText('Implementation Steps'), { 
      target: { value: 'Step 1\nStep 2' } 
    });
    
    await fireEvent.input(screen.getByLabelText('Task Name'), { 
      target: { value: 'Task 1' } 
    });
    
    await fireEvent.input(screen.getByLabelText('Task Prompt'), { 
      target: { value: 'Do something' } 
    });
    
    // Submit form
    const submitButton = screen.getByText('Create Spec');
    await fireEvent.click(submitButton);
    
    // Check that fetch was called with the right data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const [url, options] = (global.fetch as any).mock.calls[0];
      
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(options.body);
      expect(body.specName).toBe('Test Spec');
      expect(body.objective).toBe('Test objective');
      expect(body.implementation).toEqual(['Step 1', 'Step 2']);
      expect(body.tasks).toEqual([{
        name: 'Task 1',
        prompt: 'Do something',
        evaluation: ''
      }]);
    });
    
    // Check that navigation was called
    expect(goto).toHaveBeenCalledWith('/projects/test-repo/specs');
  });

  test('displays validation errors', async () => {
    render(Page);
    
    // Submit form without filling any fields
    const submitButton = screen.getByText('Create Spec');
    await fireEvent.click(submitButton);
    
    // Check for error messages
    await waitFor(() => {
      expect(screen.getByText('Spec name is required')).toBeInTheDocument();
      expect(screen.getByText('Objective is required')).toBeInTheDocument();
      expect(screen.getByText('Task name is required')).toBeInTheDocument();
      expect(screen.getByText('Task prompt is required')).toBeInTheDocument();
    });
    
    // Fetch should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('handles server errors', async () => {
    // Mock fetch to return an error
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        errors: { form: 'Server error' }
      })
    });
    
    render(Page);
    
    // Fill form with valid data
    await fireEvent.input(screen.getByLabelText('Spec Name'), { 
      target: { value: 'Test Spec' } 
    });
    
    await fireEvent.input(screen.getByLabelText('Objective'), { 
      target: { value: 'Test objective' } 
    });
    
    await fireEvent.input(screen.getByLabelText('Task Name'), { 
      target: { value: 'Task 1' } 
    });
    
    await fireEvent.input(screen.getByLabelText('Task Prompt'), { 
      target: { value: 'Do something' } 
    });
    
    // Submit form
    const submitButton = screen.getByText('Create Spec');
    await fireEvent.click(submitButton);
    
    // Check for server error message
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
    
    // Navigation should not be called
    expect(goto).not.toHaveBeenCalled();
  });
});