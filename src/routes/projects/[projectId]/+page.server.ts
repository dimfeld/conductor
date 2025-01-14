import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { documents, scannedFiles } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { scanProjectFiles } from '$lib/project/file_map.js';
import { loadProject } from '$lib/project/project.js';

export const actions = {
  forceScan: async ({ request, params, cookies }) => {
    let project = await loadProject(cookies, Number(params.projectId));
    if (!project) {
      error(404, 'Project not found');
    }

    // Don't wait for the scan to finish. Later we'll make this use SSE
    // to communicate progress.
    void project.scanProjectFiles().catch(console.error);

    return { success: true };
  },
  untrackDocument: async ({ request, params, cookies }) => {
    const formData = await request.formData();
    const doc = formData.get('doc') as string;
    if (!doc) {
      return fail(400, { message: 'No document provided' });
    }

    await db.update(documents).set({ tracked: false }).where(eq(documents.path, doc));

    return { success: true };
  },
  trackDocument: async ({ request, params }) => {
    const formData = await request.formData();
    const doc = formData.get('doc') as string;
    if (!doc) {
      return fail(400, { message: 'No document provided' });
    }

    await db
      .insert(documents)
      .values({
        projectId: Number(params.projectId),
        path: doc,
        type: 'source',
      } satisfies typeof documents.$inferInsert)
      .onConflictDoUpdate({
        target: [documents.projectId, documents.path],
        set: {
          tracked: true,
        },
      });

    return { success: true };
  },
};
