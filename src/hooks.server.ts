import { dev } from '$app/environment';
import { createLocalsServices } from '$lib/server/locals.js';
import { rollbar } from '$lib/server/rollbar.js';
import type { Span } from '@opentelemetry/api';
import { formatSpanTrace, hasSpanInfo } from '$lib/server/tracing/spans.js';
import { runInSpan } from '$lib/server/tracing/index.js';
import { error, type Handle, type HandleServerError, type RequestEvent } from '@sveltejs/kit';

const handleInternal = async (span: Span, { event, resolve }: Parameters<Handle>[0]) => {
  event.locals.traceId = span.spanContext().traceId;
  createLocalsServices(event);
  const response = await resolve(event);
  return response;
};

export const handle: Handle = async ({ event, resolve }) => {
  return runInSpan(
    {
      name: 'request',
      spanOptions: {
        attributes: {
          route: event.route.id ?? undefined,
          method: event.request.method,
          url: event.url.href,
          isDataRequest: event.isDataRequest,
          isSubRequest: event.isSubRequest
        }
      }
    },
    async (span) => handleInternal(span, { event, resolve })
  );
};

export const handleError: HandleServerError = async ({ error, event, message, status }) => {
  console.error((error as Error).stack);

  if (hasSpanInfo(error) && error._spantrace) {
    console.error(formatSpanTrace(error._spantrace));
  }

  // Log the error to Rollbar
  rollbar.error(
    error as Error,
    {
      ...event.request,
      url: event.url.href,
      user_ip: event.getClientAddress(),
      method: event.request.method,
      referrer: event.request.referrer,
      headers: {
        host: event.request.headers.get('host'),
        origin: event.request.headers.get('origin'),
        referer: event.request.headers.get('referer'),
        'user-agent': event.request.headers.get('user-agent'),
        'x-forwarded-for': event.request.headers.get('x-forwarded-for'),
        'x-forwarded-proto': event.request.headers.get('x-forwarded-proto'),
        'x-forwarded-port': event.request.headers.get('x-forwarded-port')
      }
    },
    {
      traceId: event.locals.traceId,
      route: event.route.id,
      isDataRequest: event.isDataRequest,
      isSubRequest: event.isSubRequest
    }
  );

  // Return a generic error in prod, but the full error in dev
  if (dev) {
    return {
      message: (error as Error).message || message,
      stack: (error as Error).stack,
      status
    };
  }

  return {
    message: 'An unexpected error occurred.',
    status
  };
};
