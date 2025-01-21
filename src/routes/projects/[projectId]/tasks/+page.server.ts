import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { loadProjectPlan, ManagedProjectPlan } from '$lib/project/server/plan';
import { loadProject } from '$lib/project/project';

export const load = (async ({ params }) => {}) satisfies PageServerLoad;

export const actions = {
  toggleTask: async ({ params, request, cookies }) => {
    const data = await request.formData();
    const epicIndex = parseInt(data.get('epicIndex') as string);
    const taskIndex = parseInt(data.get('taskIndex') as string);

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    await project.plan.update((plan) => {
      const task = plan.plan[epicIndex]?.tasks[taskIndex];
      if (!task) {
        error(404, 'Task not found');
      }
      task.completed = !task.completed;

      return plan;
    });

    return { success: true };
  },

  toggleSubtask: async ({ params, request, cookies }) => {
    const data = await request.formData();
    const epicIndex = parseInt(data.get('epicIndex') as string);
    const taskIndex = parseInt(data.get('taskIndex') as string);
    const subtaskIndex = parseInt(data.get('subtaskIndex') as string);

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    await project.plan.update((plan) => {
      const task = plan.plan[epicIndex]?.tasks[taskIndex];
      if (!task || !task.subtasks) {
        error(404, 'Task or subtasks not found');
      }

      const subtask = task.subtasks[subtaskIndex];
      if (!subtask) {
        error(404, 'Subtask not found');
      }
      subtask.completed = !subtask.completed;
      return plan;
    });

    return { success: true };
  },
} satisfies Actions;
