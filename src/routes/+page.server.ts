import { stat } from 'fs/promises';
import { error, fail, redirect } from '@sveltejs/kit';
import { getAllProjects, createProject } from '$lib/server/db/projects';
import { z } from 'zod';
import { superValidate, setError } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions } from './$types';
import { newProjectSchema } from './formSchema.js';

export async function load() {
  const projects = await getAllProjects();
  const form = await superValidate(zod(newProjectSchema));
  return { projects, form };
}

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, zod(newProjectSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      let exists = await stat(form.data.path);
      if (!exists.isDirectory()) {
        return setError(form, 'path', 'Path is not a directory');
      }
    } catch (e) {
      return setError(form, 'path', 'Path does not exist');
    }

    if (form.data.path.endsWith('/')) {
      form.data.path = form.data.path.slice(0, -1);
    }

    const project = await createProject(form.data);
    redirect(302, `/projects/${project.id}`);
  },
};
