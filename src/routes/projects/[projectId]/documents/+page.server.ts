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

  const docContents = await Promise.all(
    docs.map(async (doc) => {
      // TODO read custom doc subdirectory name from project.yml
      const docPath = path.join(project.path, 'docs', doc.path);
      let contents: string;
      try {
        contents = await readFile(docPath, 'utf-8');
      } catch (e) {
        console.error(e);
        contents = '';
      }

      return {
        ...doc,
        contents,
      };
    })
  );

  return { documents: docContents, edges: docParents };
};
