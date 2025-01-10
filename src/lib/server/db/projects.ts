import { eq } from 'drizzle-orm';
import { db } from './index.js';
import { projects, type NewProject } from './schema';

export async function createProject(project: NewProject) {
  return db.transaction(async (tx) => {
    const [newProject] = await tx.insert(projects).values(project).returning();

    return newProject;
  });
}

export async function getProjectById(id: number) {
  return db.query.projects.findFirst({
    where: (projects, { eq }) => eq(projects.id, id),
  });
}

export async function updateProject(id: number, project: Partial<NewProject>) {
  return db
    .update(projects)
    .set({
      ...project,
    })
    .where(eq(projects.id, id))
    .returning();
}

export async function deleteProject(id: number) {
  return db.delete(projects).where(eq(projects.id, id)).returning();
}

export async function getAllProjects() {
  return db.query.projects.findMany({
    orderBy: (projects, { asc }) => [asc(projects.name)],
  });
}
