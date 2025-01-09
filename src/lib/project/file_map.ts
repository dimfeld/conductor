import { globby } from 'globby';
import { join } from 'path';
import { db } from '$lib/server/db';
import { scannedFiles } from '$lib/server/db/schema';
import { minhashPath } from '@repo/rust_helper';
import { eq, and } from 'drizzle-orm';
import { stat } from 'fs/promises';
import { Buffer } from 'buffer';

interface ScanOptions {
  projectId: number;
  projectRoot: string;
  include: string[];
  exclude: string[];
}

function jaccardSimilarity(hash1: Buffer | null, hash2: Buffer): number {
  if (!hash1 || !hash2) return 0;
  if (hash1.length !== hash2.length) {
    throw new Error('Minhash signatures must have the same length');
  }

  let matches = 0;
  for (let i = 0; i < hash1.length; i += 4) {
    const value1 = hash1.readUint32LE(i);
    const value2 = hash2.readUint32LE(i);
    if (value1 === value2) {
      matches++;
    }
  }

  return matches / (hash1.length / 4);
}

export async function scanProjectFiles({ projectId, projectRoot, include, exclude }: ScanOptions) {
  // Get all matching files using globby
  const files = await globby(include, {
    cwd: projectRoot,
    ignore: exclude,
    dot: true,
    absolute: false, // Keep paths relative to projectRoot
  });

  // Load existing scanned files for this project
  const existingFiles = await db
    .select()
    .from(scannedFiles)
    .where(eq(scannedFiles.projectId, projectId));

  // Create lookup map for faster access
  const existingFileMap = new Map(existingFiles.map((file) => [file.path, file]));

  for (const relativePath of files) {
    const fullPath = join(projectRoot, relativePath);
    const stats = await stat(fullPath);
    const fileTimestamp = stats.mtime;

    const existing = existingFileMap.get(relativePath);

    // Check if file is new or modified
    if (!existing || existing.file_timestamp.getTime() !== fileTimestamp.getTime()) {
      // Generate new minhash
      const hashArray = minhashPath(fullPath);
      const currentMinhash = new Uint32Array(hashArray).buffer;

      if (!existing) {
        // Insert new file
        await db.insert(scannedFiles).values({
          projectId,
          path: relativePath,
          file_timestamp: fileTimestamp,
          current_minhash: currentMinhash,
          last_minhash: currentMinhash,
        });
      } else {
        let needsAnalysis = existing.needsAnalysis;
        if (!needsAnalysis) {
          // Perform jaccard similarity on last_minhash and current_minhash
          const similarity = jaccardSimilarity(existing.last_minhash, currentMinhash);
          if (similarity < 0.6) {
            needsAnalysis = true;
          }
        }

        // Update existing file
        await db
          .update(scannedFiles)
          .set({
            file_timestamp: fileTimestamp,
            current_minhash: currentMinhash,
            needsAnalysis: true,
          })
          .where(and(eq(scannedFiles.projectId, projectId), eq(scannedFiles.path, relativePath)));

        // TODO: Compare minhash similarity between last_minhash and current_minhash
        // to detect significant changes. This could be used to trigger
        // re-analysis of file contents or alert about major changes.
      }
    }
  }

  // Remove records for files that no longer exist
  const currentPaths = new Set(files);
  const removedFiles = existingFiles.filter((file) => !currentPaths.has(file.path));

  if (removedFiles.length > 0) {
    await db
      .delete(scannedFiles)
      .where(
        and(eq(scannedFiles.projectId, projectId), eq(scannedFiles.path, removedFiles[0].path))
      );
  }
}
