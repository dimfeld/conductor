import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { documentParents, documents, projects } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
  const { projectId } = params;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, Number(projectId)),
  });

  if (!project) {
    error(404, 'Project not found');
  }

  const docParents = await db.query.documentParents.findMany({
    where: eq(documentParents.projectId, Number(projectId)),
  });

  return { edges: docParents };
};
