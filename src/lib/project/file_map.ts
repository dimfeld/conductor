import { globby } from 'globby';
import { join } from 'path';
import { db } from '$lib/server/db';
import { scannedFiles, type ScannedFile } from '$lib/server/db/schema';
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

function jaccardSimilarity(hash1: Uint32Array | null, hash2: Uint32Array): number {
  if (!hash1 || !hash2) return 0;
  if (hash1.length !== hash2.length) {
    throw new Error('Minhash signatures must have the same length');
  }

  let matches = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] === hash2[i]) {
      matches++;
    }
  }

  return matches / hash1.length;
}

export async function scanProjectFiles({ projectId, projectRoot, include, exclude }: ScanOptions) {
  // Get all matching files using globby
  const files = await globby(include, {
    cwd: projectRoot,
    ignore: exclude,
    gitignore: true,
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
      const newMinHash = minhashPath(fullPath);

      if (!existing) {
        // Insert new file
        let hashArg = Buffer.from(newMinHash.buffer);
        await db.insert(scannedFiles).values({
          projectId,
          path: relativePath,
          file_timestamp: fileTimestamp,
          current_minhash: hashArg,
          analyzed_minhash: hashArg,
          needsAnalysis: true,
        });
      } else {
        let needsAnalysis = existing.needsAnalysis;
        if (!needsAnalysis) {
          // Perform jaccard similarity on last_minhash and current_minhash
          let analyzedHashArray = existing.analyzed_minhash
            ? new Uint32Array(
                existing.analyzed_minhash.buffer,
                existing.analyzed_minhash.byteOffset,
                existing.analyzed_minhash.length / Uint32Array.BYTES_PER_ELEMENT
              )
            : null;
          const similarity = jaccardSimilarity(analyzedHashArray, newMinHash);
          if (similarity < 0.6) {
            needsAnalysis = true;
          }
        }

        // Update existing file
        let newMinHashArg = Buffer.from(newMinHash.buffer);
        let updates: Partial<ScannedFile> = {
          file_timestamp: fileTimestamp,
          current_minhash: newMinHashArg,
          needsAnalysis,
        };

        if (needsAnalysis) {
          updates.analyzed_minhash = newMinHashArg;
        }

        await db
          .update(scannedFiles)
          .set(updates)
          .where(and(eq(scannedFiles.projectId, projectId), eq(scannedFiles.path, relativePath)));
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
