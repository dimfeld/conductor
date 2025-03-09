import { loadConfig } from '$lib/config';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
  try {
    const config = loadConfig();
    return {};
  } catch (err) {
    console.error('Failed to load config:', err);
    throw error(404, 'Configuration not found');
  }
};
