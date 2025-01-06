import { PUBLIC_GIT_REF, PUBLIC_ROLLBAR_CLIENT_TOKEN } from '$env/static/public';
import { dev } from '$app/environment';
import type { HandleClientError } from '@sveltejs/kit';
import Rollbar from 'rollbar';

// Initialize Rollbar for client-side
window.Rollbar = Rollbar.init({
  accessToken: PUBLIC_ROLLBAR_CLIENT_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: process.env.NODE_ENV,
  enabled: !dev && import.meta.env.MODE !== 'development' && process.env.NODE_ENV !== 'development',
  payload: {
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: PUBLIC_GIT_REF,
        guess_uncaught_frames: true,
      },
    },
    gitRef: PUBLIC_GIT_REF,
  },
});

export const handleError: HandleClientError = ({ error, event }) => {
  console.error(error);
  window.Rollbar.error(error as Error, {
    url: event.url.toString(),
    route: event.route.id,
  });
};
