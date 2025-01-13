import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { documents, scannedFiles } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const actions = {
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
