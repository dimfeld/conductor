import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { loadProjectPlan, ManagedProjectPlan } from '$lib/project/server/plan';
import { loadProject } from '$lib/project/project';

export const load = (async ({ params }) => {}) satisfies PageServerLoad;

export const actions = {
  addEpic: async ({ params, request, cookies }) => {
    const data = await request.formData();
    const title = data.get('title') as string;
    if (!title?.trim()) {
      error(400, 'Title is required');
    }

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    await project.plan.update((plan) => {
      const id = project.plan.nextId++;
      plan.plan.push({
        id,
        title,
        tasks: [],
      });
      return plan;
    });

    return { success: true };
  },

  addTask: async ({ params, request, cookies }) => {
    const data = await request.formData();
    const epicId = parseInt(data.get('epicId') as string);
    const title = data.get('title') as string;
    if (!title?.trim()) {
      error(400, 'Title is required');
    }

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    await project.plan.update((plan) => {
      const epic = plan.plan.find((epic) => epic.id === epicId);
      if (!epic) {
        error(404, 'Epic not found');
      }

      const id = project.plan.nextId++;
      epic.tasks.push({
        id,
        title,
        completed: false,
        subtasks: [],
      });
      return plan;
    });

    return { success: true };
  },

  addSubtask: async ({ params, request, cookies }) => {
    const data = await request.formData();
    const epicId = parseInt(data.get('epicId') as string);
    const taskId = parseInt(data.get('taskId') as string);
    const title = data.get('title') as string;
    if (!title?.trim()) {
      error(400, 'Title is required');
    }

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    await project.plan.update((plan) => {
      const task = project.plan.findTask(epicId, taskId);
      if (!task) {
        error(404, 'Task not found');
      }

      if (!task.subtasks) {
        task.subtasks = [];
      }

      const id = project.plan.nextId++;
      task.subtasks.push({
        id,
        title,
        completed: false,
      });
      return plan;
    });

    return { success: true };
  },

  toggleTask: async ({ params, request, cookies }) => {
    const data = await request.formData();
    const epicId = parseInt(data.get('epicId') as string);
    const taskId = parseInt(data.get('taskId') as string);

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    await project.plan.update((plan) => {
      const task = project.plan.findTask(epicId, taskId);
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
    const epicId = parseInt(data.get('epicId') as string);
    const taskId = parseInt(data.get('taskId') as string);
    const subtaskId = parseInt(data.get('subtaskId') as string);

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    await project.plan.update((plan) => {
      const subtask = project.plan.findSubtask(epicId, taskId, subtaskId);
      if (!subtask) {
        error(404, 'Subtask not found');
      }
      subtask.completed = !subtask.completed;
      return plan;
    });

    return { success: true };
  },
} satisfies Actions;
