import { fail, superValidate } from 'sveltekit-superforms';
import type { DocumentWithContents } from '../types';
import { formSchema } from './formSchema';
import { zod } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const load = async ({ params, fetch }) => {
  const response = await fetch(`/projects/${params.projectId}/documents/${params.documentId}`);
  const doc = await response.json();
  const form = await superValidate(zod(formSchema));

  const parentDocs = db.query.documentParents.findMany({
    where: (documentParents, { eq }) => eq(documentParents.childDocumentId, +params.documentId),
  });

  const childDocs = db.query.documentParents.findMany({
    where: (documentParents, { eq }) => eq(documentParents.parentDocumentId, +params.documentId),
  });

  return { doc: doc as DocumentWithContents, form, parentDocs, childDocs };
};

export const actions = {
  update: async ({ request, params }) => {
    const form = await superValidate(request, zod(formSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const r = await fetch(`/projects/${params.projectId}/documents/${params.documentId}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(form.data),
    });

    if (r.ok) {
      return { form };
    } else {
      error(r.status, await r.text());
    }
  },
};
