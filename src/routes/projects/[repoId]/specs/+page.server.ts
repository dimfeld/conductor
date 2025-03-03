import { loadConfig } from '$lib/config';
import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const repoId = params.repoId;
  
  // Load config and find the repository by ID
  const config = loadConfig();
  const repository = config.repositories.find(repo => repo.id === repoId);
  
  if (!repository) {
    throw error(404, `Repository '${repoId}' not found`);
  }
  
  // Get path to specs directory
  const specsPath = path.join(repository.path, 'specs');
  
  try {
    // Read and filter spec files
    const files = fs.readdirSync(specsPath, { withFileTypes: false });
    const specFiles = files.filter(file => typeof file === 'string' && file.endsWith('.yaml'));
    
    return { specFiles };
  } catch (err) {
    // If directory doesn't exist or can't be read
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { specFiles: [] };
    }
    
    console.error(`Error reading specs directory: ${err}`);
    throw error(500, 'Failed to read spec files');
  }
};