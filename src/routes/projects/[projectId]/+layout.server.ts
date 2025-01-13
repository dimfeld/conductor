import { db } from '$lib/server/db';
import { documents, projects } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, Number(params.projectId)));

  // Return a list of documents in the project
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.projectId, Number(params.projectId)));

  return { project, documents: docs };
};
