import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadProject } from '$lib/project/project';
import type { DocumentWithContents } from '../types.js';

export async function GET({ params, cookies }) {
  const projectId = parseInt(params.projectId);
  const documentId = parseInt(params.documentId);

  // Get document from database
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.projectId, projectId), eq(documents.id, documentId)),
  });

  if (!doc) {
    error(404, 'Document not found');
  }

  // Get the project to find the root path
  const project = await loadProject(cookies, projectId);
  if (!project) {
    error(404, 'Project not found');
  }

  // Read the file contents
  try {
    const fullPath = join(project.docsPath, doc.path);
    const contents = await readFile(fullPath, 'utf-8');

    return json({
      ...doc,
      contents,
    } satisfies DocumentWithContents);
  } catch (e) {
    console.error('Error reading document file:', e);
    error(500, 'Error reading document file');
  }
}

export async function PUT({ params, request, cookies }) {
  const projectId = parseInt(params.projectId);
  const documentId = parseInt(params.documentId);

  // Get document from database
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.projectId, projectId), eq(documents.id, documentId)),
  });

  if (!doc) {
    error(404, 'Document not found');
  }

  // Get the project to find the root path
  const project = await loadProject(cookies, projectId);
  if (!project) {
    error(404, 'Project not found');
  }

  try {
    const body = await request.json();
    const contents = body.contents;
    if (typeof contents !== 'string') {
      error(400, 'Content must be a string');
    }

    // Write the file contents
    const fullPath = join(project.docsPath, doc.path);
    await writeFile(fullPath, contents, 'utf-8');

    // Update any metadata if provided
    const updateData: Partial<typeof doc> = {};
    if (body.description !== undefined) updateData.description = body.description;
    if (body.canvas_location_x !== undefined) updateData.canvas_location_x = body.canvas_location_x;
    if (body.canvas_location_y !== undefined) updateData.canvas_location_y = body.canvas_location_y;
    if (body.canvas_location_width !== undefined)
      updateData.canvas_location_width = body.canvas_location_width;
    if (body.canvas_location_height !== undefined)
      updateData.canvas_location_height = body.canvas_location_height;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(documents)
        .set(updateData)
        .where(and(eq(documents.projectId, projectId), eq(documents.id, documentId)));
    }

    return json({ success: true });
  } catch (e) {
    console.error('Error updating document:', e);
    error(500, e as Error);
  }
}
