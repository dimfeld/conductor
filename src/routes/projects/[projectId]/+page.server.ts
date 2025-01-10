import { getProjectById } from '$lib/server/db/projects';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  const project = await getProjectById(Number(params.projectId));
  if (!project) {
    error(404, 'Project not found');
  }

  return { project };
}
