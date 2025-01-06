import { env } from '$env/dynamic/private';
import { initTracing } from './node.js';
import { createSpanRunner } from './spans.js';
import * as opentelemetry from '@opentelemetry/api';

export const otelSdk = initTracing('inbox', env);

export const tracer = opentelemetry.trace.getTracer('inbox');
export const runInSpan = createSpanRunner(tracer);
