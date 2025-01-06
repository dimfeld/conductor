import Rollbar from 'rollbar';
import { dev } from '$app/environment';
import { PUBLIC_GIT_REF } from '$env/static/public';
import { env } from '$env/dynamic/private';

export const rollbar = new Rollbar({
  accessToken: env.ROLLBAR_SERVER_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: process.env.NODE_ENV,
  enabled: !dev && import.meta.env.MODE !== 'development' && process.env.NODE_ENV !== 'development',
  payload: {
    gitRef: PUBLIC_GIT_REF,
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: PUBLIC_GIT_REF,
        guess_uncaught_frames: true
      }
    }
  }
});
