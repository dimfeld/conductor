import { fail, superValidate } from 'sveltekit-superforms';
import type { DocumentWithContents } from '../types';
import { formSchema } from './formSchema';
import { zod } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const load = async ({ params, fetch }) => {
  const response = await fetch(`/projects/${params.projectId}/documents/${params.documentId}`);
  const doc: DocumentWithContents = await response.json();
  console.log({ doc });
  const form = await superValidate(
    { description: doc.description ?? '', contents: doc.contents },
    zod(formSchema)
  );

  const parentDocs = db.query.documentParents.findMany({
    where: (documentParents, { eq }) => eq(documentParents.childDocumentId, +params.documentId),
  });

  const childDocs = db.query.documentParents.findMany({
    where: (documentParents, { eq }) => eq(documentParents.parentDocumentId, +params.documentId),
  });

  return { heading: doc.path, doc, form, parentDocs: await parentDocs, childDocs: await childDocs };
};

export const actions = {
  update: async ({ request, params, fetch }) => {
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
