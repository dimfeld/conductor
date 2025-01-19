import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { loadProjectPlan, ManagedProjectPlan } from '$lib/project/server/plan';
import { loadProject } from '$lib/project/project';

export const load = (async ({ params }) => {}) satisfies PageServerLoad;

export const actions = {
  toggleStory: async ({ params, request, cookies }) => {
    const data = await request.formData();
    const epicIndex = parseInt(data.get('epicIndex') as string);
    const storyIndex = parseInt(data.get('storyIndex') as string);

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    await project.plan.update((plan) => {
      const story = plan.plan[epicIndex]?.stories[storyIndex];
      if (!story) {
        error(404, 'Story not found');
      }
      story.completed = !story.completed;

      return plan;
    });

    return { success: true };
  },

  toggleSubtask: async ({ params, request, cookies }) => {
    const data = await request.formData();
    const epicIndex = parseInt(data.get('epicIndex') as string);
    const storyIndex = parseInt(data.get('storyIndex') as string);
    const subtaskIndex = parseInt(data.get('subtaskIndex') as string);

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    await project.plan.update((plan) => {
      const story = plan.plan[epicIndex]?.stories[storyIndex];
      if (!story || !story.subtasks) {
        error(404, 'Story or subtasks not found');
      }

      const subtask = story.subtasks[subtaskIndex];
      if (!subtask) {
        error(404, 'Subtask not found');
      }
      subtask.completed = !subtask.completed;
      return plan;
    });

    return { success: true };
  },
} satisfies Actions;
