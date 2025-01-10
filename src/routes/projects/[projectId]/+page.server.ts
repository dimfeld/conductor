import { getProjectById } from '$lib/server/db/projects';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { scannedFiles } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export async function load({ params }) {
  const project = await getProjectById(Number(params.projectId));
  if (!project) {
    error(404, 'Project not found');
  }

  const projectFiles = await db.query.scannedFiles.findMany({
    columns: {
      path: true,
      short_description: true,
      area: true,
    },
    where: eq(scannedFiles.projectId, project.id),
  });

  return { project, projectFiles };
}
