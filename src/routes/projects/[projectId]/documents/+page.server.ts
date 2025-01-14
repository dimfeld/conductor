import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { documentParents, documents, projects } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'path';

export const load = async ({ params }) => {
  const { projectId } = params;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, Number(projectId)),
  });

  if (!project) {
    error(404, 'Project not found');
  }

  const docs = await db.query.documents.findMany({
    where: eq(documents.projectId, Number(projectId)),
  });

  const docParents = await db.query.documentParents.findMany({
    where: eq(documentParents.projectId, Number(projectId)),
  });

  return { edges: docParents };
};
