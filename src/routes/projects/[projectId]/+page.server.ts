import { getProjectById } from '$lib/server/db/projects';
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { documents, scannedFiles } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { loadProject } from '$lib/project/project.js';

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

export const actions = {
  trackDocument: async ({ request, params, cookies }) => {
    const formData = await request.formData();
    const doc = formData.get('doc') as string;
    if (!doc) {
      return fail(400, { message: 'No document provided' });
    }

    const project = await loadProject(cookies, Number(params.projectId));

    await db
      .insert(documents)
      .values({
        projectId: Number(params.projectId),
        path: doc,
        type: 'source',
      } satisfies typeof documents.$inferInsert)
      .onConflictDoNothing();

    return { success: true };
  },
};
