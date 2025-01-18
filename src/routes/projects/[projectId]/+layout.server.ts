import { loadProject } from '$lib/project/project.js';
import { db } from '$lib/server/db';
import { documents, projects, scannedFiles } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async (event) => {
  const { params } = event;
  const project = await loadProject(event, Number(params.projectId));
  if (!project) {
    error(404, 'Project not found');
  }

  const plan = project.plan.data;

  // Return a list of documents in the project
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.projectId, Number(params.projectId)));

  const knownDocPaths = new Set(docs.map((doc) => doc.path));
  const untrackedDocs = Array.from(project.allDocs).filter((doc) => !knownDocPaths.has(doc));

  const projectFiles = await db.query.scannedFiles.findMany({
    columns: {
      path: true,
      short_description: true,
      area: true,
      needsAnalysis: true,
    },
    where: eq(scannedFiles.projectId, Number(params.projectId)),
  });

  return {
    heading: project.projectInfo.name,
    project: project.projectInfo,
    documents: docs,
    plan,
    untrackedDocs,
    projectFiles,
  };
};
