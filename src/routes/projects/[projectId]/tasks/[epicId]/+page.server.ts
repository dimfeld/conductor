import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { join } from 'node:path';
import { loadProject } from '$lib/project/project';
import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { generatePlanDocPath } from '$lib/project/server/plan';

const epicPlanSchema = z.object({
  title: z.string().min(1),
  focus: z.string(),
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

  const epic = project.plan.data.plan.find((e) => e.id === epicId);
  if (!epic) {
    error(404, 'Epic not found');
  }

  let epicPlan = '';
  if (epic.plan_file) {
    const epicPlanPath = join(project.docsPath, epic.plan_file);
    epicPlan = await readFile(epicPlanPath, 'utf-8');
  }

  const form = await superValidate(
    {
      title: epic.title,
      focus: epic.focus || '',
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
  default: async ({ request, cookies, params }) => {
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

    const epic = project.plan.data.plan.find((e) => e.id === epicId);
    if (!epic) {
      error(404, 'Epic not found');
    }

    // Update the epic title and focus
    let needsUpdate =
      epic.title !== form.data.title || epic.focus !== form.data.focus || !epic.plan_file;

    if (needsUpdate) {
      epic.title = form.data.title;
      epic.focus = form.data.focus;
      // Generate a filename based on the epic ID and title
      if (!epic.plan_file) {
        epic.plan_file = generatePlanDocPath('epic', { id: epicId, title: form.data.title });
      }

      await project.plan.save();
    }

    // Save the plan content
    const planPath = join(project.docsPath, epic.plan_file!);
    await writeFile(planPath, form.data.content);

    return { form };
  },
} satisfies Actions;
