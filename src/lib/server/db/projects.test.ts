import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-utils.js';
import { createProject, getProjectById, updateProject, deleteProject } from './projects';

describe('Project Data Structure', () => {
  beforeEach(() => {
    createTestDb();
  });

  it('should create a project with all fields', async () => {
    const project = await createProject({
      name: 'Test Project',
      path: '/test/path',
    });

    expect(project).toMatchObject({
      name: 'Test Project',
      path: '/test/path',
    });
  });

  it('should retrieve a project with relationships', async () => {
    const project = await createProject({
      name: 'Test Project',
      path: '/test/path',
    });

    const retrieved = await getProjectById(project.id);
    expect(retrieved).toMatchObject({
      id: project.id,
      name: 'Test Project',
      path: '/test/path',
    });
  });

  it('should update project details', async () => {
    const project = await createProject({
      name: 'Test Project',
      path: '/test/path',
    });

    const updated = await updateProject(project.id, {
      name: 'Updated Project',
    });

    expect(updated[0]).toMatchObject({
      id: project.id,
      name: 'Updated Project',
    });
  });

  it('should delete a project and its relationships', async () => {
    const project = await createProject({
      name: 'Test Project',
      path: '/test/path',
    });

    await deleteProject(project.id);
    const retrieved = await getProjectById(project.id);
    expect(retrieved).toBeUndefined();
  });
});
