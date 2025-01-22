import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { dirname, join } from 'node:path';
import { loadProject } from '$lib/project/project';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { generatePlanDocPath } from '$lib/project/server/plan';
import { createEpicPlanning } from '$lib/project/create_documents';

const epicPlanSchema = z.object({
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

  const epic = project.plan.findEpic(epicId);
  if (!epic) {
    error(404, 'Epic not found');
  }

  let epicPlan = '';
  if (epic.plan_file) {
    const epicPlanPath = join(project.docsPath, epic.plan_file);
    try {
      epicPlan = await readFile(epicPlanPath, 'utf-8');
    } catch (e) {
      // file might not exist
    }
  }

  const form = await superValidate(
    {
      title: epic.title,
      description: epic.description || '',
      content: epicPlan,
    },
    zod(epicPlanSchema)
  );

  return {
    heading: epic.title,
    epic,
    form,
  };
};

export const actions: Actions = {
  save: async ({ request, cookies, params }) => {
    const form = await superValidate(request, zod(epicPlanSchema));
    if (!form.valid) {
      return { form };
    }

    const project = await loadProject(cookies, +params.projectId);
    if (!project) {
      error(404, 'Project not found');
    }

    const epicId = parseInt(params.epicId);
    if (isNaN(epicId)) {
      error(400, 'Invalid epic ID');
    }

    const epic = project.plan.findEpic(epicId);
    if (!epic) {
      error(404, 'Epic not found');
    }

    // Update the epic title and focus
    let needsUpdate =
      epic.title !== form.data.title ||
      epic.description !== form.data.description ||
      !epic.plan_file;

    if (needsUpdate) {
      epic.title = form.data.title;
      epic.description = form.data.description;
      // Generate a filename based on the epic ID and title
      if (!epic.plan_file) {
        epic.plan_file = generatePlanDocPath('epic', { id: epicId, title: form.data.title });
      }

      await project.plan.save();
    }

    // Save the plan content
    const planPath = join(project.docsPath, epic.plan_file!);
    await mkdir(dirname(planPath), { recursive: true });
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

    const epic = project.plan.findEpic(epicId);
    if (!epic) {
      error(404, 'Epic not found');
    }

    const epicIndex = project.plan.data.plan.findIndex((e) => e.id === epicId);
    const plan = await createEpicPlanning({
      project,
      epicIndex,
    });

    if (!epic.plan_file) {
      epic.plan_file = generatePlanDocPath('epic', { id: epicId, title: epic.title });
      await project.plan.save();
    }

    // Save the plan content
    const planPath = join(project.docsPath, epic.plan_file);
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
    await project.plan.update((plan) => {
      const epicIndex = plan.plan.findIndex((epic) => epic.id === epicId);
      if (epicIndex === -1) {
        error(404, 'Epic not found');
      }

      plan.plan.splice(epicIndex, 1);
      return plan;
    });

    redirect(303, `/projects/${params.projectId}/tasks`);
  },
} satisfies Actions;
