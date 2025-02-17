import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { join } from 'node:path';
import { loadProject } from '$lib/project/project';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { generatePlanDocPath } from '$lib/project/server/plan';
import { dirname } from 'node:path';
import { createTaskPlanning } from '$lib/project/create_documents';

const taskPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  content: z.string(),
});

export const load: PageServerLoad = async ({ params, cookies }) => {
  const projectId = params.projectId;
  const project = await loadProject(cookies, +projectId);
  if (!project) {
    error(404, 'Project not found');
  }

  const epicId = parseInt(params.epicId);
  if (isNaN(epicId)) {
    error(400, 'Invalid epic ID');
  }

  const task = project.plan.findTask(epicId, parseInt(params.taskId));
  if (!task) {
    error(404, 'Task not found');
  }

  let taskPlan = '';
  if (task.plan_file) {
    const taskPlanPath = join(project.docsPath, task.plan_file);
    taskPlan = await readFile(taskPlanPath, 'utf-8');
  }

  const form = await superValidate(
    {
      title: task.title,
      description: task.description || '',
      content: taskPlan,
    },
    zod(taskPlanSchema)
  );

  return {
    heading: task.title,
    task,
    form,
  };
};

export const actions: Actions = {
  save: async ({ request, cookies, params }) => {
    const form = await superValidate(request, zod(taskPlanSchema));
    if (!form.valid) {
      return { form };
    }

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    const task = project.plan.findTask(parseInt(params.epicId), parseInt(params.taskId));
    if (!task) {
      error(404, 'Task not found');
    }

    // Update the task title and focus
    let needsUpdate =
      task.title !== form.data.title ||
      task.description !== form.data.description ||
      !task.plan_file;

    if (needsUpdate) {
      task.title = form.data.title;
      task.description = form.data.description;
      // Generate a filename based on the epic ID and title
      if (!task.plan_file) {
        task.plan_file = generatePlanDocPath('task', { id: task.id!, title: form.data.title });
      }

      await project.plan.save();
    }

    // Save the plan content
    const planPath = join(project.docsPath, task.plan_file!);
    await writeFile(planPath, form.data.content);

    return { form };
  },

  addSubtask: async ({ params, request, cookies }) => {
    const data = await request.formData();
    const epicId = parseInt(params.epicId);
    const taskId = parseInt(params.taskId);
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

  toggle: async ({ cookies, params }) => {
    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    const task = project.plan.findTask(parseInt(params.epicId), parseInt(params.taskId));
    if (!task) {
      error(404, 'Task not found');
    }

    task.completed = !task.completed;
    await project.plan.save();
  },

  generatePlan: async ({ cookies, params }) => {
    const projectId = params.projectId;
    const project = await loadProject(cookies, +projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    const epicId = parseInt(params.epicId);
    if (isNaN(epicId)) {
      error(400, 'Invalid epic ID');
    }

    const taskId = parseInt(params.taskId);
    if (isNaN(taskId)) {
      error(400, 'Invalid task ID');
    }

    const epic = project.plan.findEpic(epicId);
    if (!epic) {
      error(404, 'Epic not found');
    }

    const epicIndex = project.plan.data.plan.findIndex((e) => e.id === epicId);
    const taskIndex = epic.tasks.findIndex((s) => s.id === taskId);
    if (taskIndex === -1) {
      error(404, 'Task not found');
    }

    const task = epic.tasks[taskIndex];
    const plan = await createTaskPlanning({
      project,
      epicIndex,
      taskIndex,
    });

    if (!task.plan_file) {
      task.plan_file = generatePlanDocPath('task', { id: taskId, title: task.title });
      await project.plan.save();
    }

    // Save the plan content
    const planPath = join(project.docsPath, task.plan_file);
    await mkdir(dirname(planPath), { recursive: true });
    await writeFile(planPath, plan);

    return { plan };
  },

  delete: async ({ cookies, params }) => {
    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    const epicId = +params.epicId;
    const taskId = +params.taskId;
    await project.plan.update((plan) => {
      const epic = plan.plan.find((epic) => epic.id === epicId);
      if (!epic) {
        error(404, 'Epic not found');
      }

      const taskIndex = epic.tasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) {
        error(404, 'Task not found');
      }

      epic.tasks.splice(taskIndex, 1);
      return plan;
    });

    redirect(303, `/projects/${params.projectId}/tasks/${params.epicId}`);
  },
} satisfies Actions;
