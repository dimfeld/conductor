import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { dirname, join } from 'node:path';
import { loadProject } from '$lib/project/project';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { generatePlanDocPath } from '$lib/project/server/plan';
import { createSubtaskPlanning, createTaskPlanning } from '$lib/project/create_documents';

const subtaskPlanSchema = z.object({
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

  const subtask = project.plan.findSubtask(
    parseInt(params.epicId),
    parseInt(params.taskId),
    parseInt(params.subtaskId)
  );
  if (!subtask) {
    error(404, 'Subtask not found');
  }

  let subtaskPlan = '';
  if (subtask.plan_file) {
    const subtaskPlanPath = join(project.docsPath, subtask.plan_file);
    subtaskPlan = await readFile(subtaskPlanPath, 'utf-8');
  }

  const form = await superValidate(
    {
      title: subtask.title,
      description: subtask.description || '',
      content: subtaskPlan,
    },
    zod(subtaskPlanSchema)
  );

  return {
    heading: subtask.title,
    subtask,
    form,
  };
};

export const actions: Actions = {
  save: async ({ request, cookies, params }) => {
    const form = await superValidate(request, zod(subtaskPlanSchema));
    if (!form.valid) {
      return { form };
    }

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    const subtask = project.plan.findSubtask(
      parseInt(params.epicId),
      parseInt(params.taskId),
      parseInt(params.subtaskId)
    );
    if (!subtask) {
      error(404, 'Subtask not found');
    }

    // Update the task title and focus
    let needsUpdate =
      subtask.title !== form.data.title ||
      subtask.description !== form.data.description ||
      !subtask.plan_file;

    if (needsUpdate) {
      subtask.title = form.data.title;
      subtask.description = form.data.description;
      // Generate a filename based on the epic ID and title
      if (!subtask.plan_file) {
        subtask.plan_file = generatePlanDocPath('subtask', {
          id: subtask.id!,
          title: form.data.title,
        });
      }

      await project.plan.save();
    }

    // Save the plan content
    const planPath = join(project.docsPath, subtask.plan_file!);
    await writeFile(planPath, form.data.content);

    return { form };
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

    const subtaskId = parseInt(params.subtaskId);
    if (isNaN(subtaskId)) {
      error(400, 'Invalid subtask ID');
    }
    const subtaskIndex = epic.tasks[taskIndex]?.subtasks?.findIndex((s) => s.id === subtaskId);
    if (subtaskIndex === -1 || subtaskIndex === undefined) {
      error(404, 'Subtask not found');
    }

    const subtask = epic.tasks[taskIndex]?.subtasks?.[subtaskIndex];
    if (!subtask) {
      error(404, 'Subtask not found');
    }

    const plan = await createSubtaskPlanning({
      project,
      epicIndex,
      taskIndex,
      subtaskIndex,
    });

    if (!subtask.plan_file) {
      subtask.plan_file = generatePlanDocPath('subtask', { id: taskId, title: subtask.title });
      await project.plan.save();
    }

    // Save the plan content
    const planPath = join(project.docsPath, subtask.plan_file);
    await mkdir(dirname(planPath), { recursive: true });
    await writeFile(planPath, plan);

    return { plan };
  },
} satisfies Actions;
