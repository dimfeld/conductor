import { defineConfig } from 'vite';
import type { PluginOption } from 'vite';
import { gitRef } from './gitRef.js';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { initTracing } from './src/lib/server/tracing/node.js';

process.env.PUBLIC_GIT_REF = gitRef;

const tracing: PluginOption = {
  name: 'tracing',
  configureServer(server) {
    // Do this before anything else loads so that autoinstrumentation can kick in.
    initTracing('seneschal', { TRACK_SPANS: 'true', NODE_ENV: 'development' });
  },
  configurePreviewServer(server) {
    initTracing('seneschal', { TRACK_SPANS: 'true', NODE_ENV: 'development' });
  }
};

export default defineConfig({
  plugins: [sveltekit(), svelteTesting(), tracing],
  clearScreen: false,
  build: {
    sourcemap: true
  },
  // @ts-expect-error Type difference until vite 6 officially supported
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.js']
  }
});
