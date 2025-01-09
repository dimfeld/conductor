import {
  type AttributeValue,
  type Span,
  type SpanOptions,
  SpanStatusCode,
  type Tracer,
} from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import * as opentelemetry from '@opentelemetry/api';
import { Span as SdkSpan } from '@opentelemetry/sdk-trace-base';
import { getAncestorSpanProcessor } from './tracking.js';

export interface RunInSpanOptions {
  /** The name of this span */
  name: string;
  type?: string;
  tags?: string[];
  info?: object;

  /** Options for the OpenTelemetry span that will wrap this step. */
  spanOptions?: SpanOptions;

  /** Override the parent OpenTelemetry span */
  parentSpan?: opentelemetry.Context;
}

/** Add an event to the current span. */
export function addSpanEvent(name: string, attributes?: opentelemetry.Attributes) {
  opentelemetry.trace.getActiveSpan()?.addEvent(name, attributes);
}

/** Add an event to the current span. */
export function addSpanAttributes(attributes: object) {
  const span = opentelemetry.trace.getActiveSpan();
  const attrs = objectToSpanAttributeValues(attributes);
  if (span && attrs) {
    span.setAttributes(attrs);
  }
}

export interface ErrorWithSpanInfo extends Error {
  _handledSpan?: true;
  _spantrace?: SdkSpan[];
}

export function hasSpanInfo(e: unknown): e is ErrorWithSpanInfo {
  return typeof e === 'object' && e != null && (e as ErrorWithSpanInfo)._handledSpan === true;
}

function isPromise<T>(f: ((span: Span) => Promise<T>) | PromiseLike<T>): f is PromiseLike<T> {
  return typeof (f as Promise<T>).then === 'function';
}

export async function runInSpanWithParent<T>(
  tracer: Tracer,
  spanName: string,
  options: SpanOptions,
  parent: opentelemetry.Context | undefined,
  f: ((span: Span) => Promise<T>) | PromiseLike<T>
): Promise<T> {
  parent ??= opentelemetry.context.active();
  return tracer.startActiveSpan(spanName, options, parent, async (span) => {
    try {
      let value = isPromise(f) ? await f : await f(span);
      return value;
    } catch (e) {
      if (e instanceof Error && !(e as ErrorWithSpanInfo)._handledSpan) {
        (e as ErrorWithSpanInfo)._handledSpan = true;

        let ancestorSpanProcessor = getAncestorSpanProcessor();
        if (ancestorSpanProcessor) {
          (e as ErrorWithSpanInfo)._spantrace = ancestorSpanProcessor.getAncestorSpans(
            span.spanContext().spanId
          );
        }

        span.recordException(e);
        span.setStatus({ code: SpanStatusCode.ERROR });
      }

      throw e;
    } finally {
      span.end();
    }
  });
}

export function runInSpan<T>(
  tracer: opentelemetry.Tracer,
  options: RunInSpanOptions | string,
  fn: ((span: Span) => Promise<T>) | PromiseLike<T>
): Promise<T> {
  if (typeof options === 'string') {
    options = { name: options };
  }

  let spanOptions: SpanOptions = options.spanOptions ?? {};

  if (options.tags?.length) {
    spanOptions.attributes ??= {};
    spanOptions.attributes.tag = options.tags;
  }

  if (options.type) {
    spanOptions.attributes ??= {};
    spanOptions.attributes.type = options.type;
  }

  if (options.info) {
    spanOptions.attributes = {
      ...spanOptions.attributes,
      ...objectToSpanAttributeValues(options.info),
    };
  }

  return runInSpanWithParent(tracer, options.name, spanOptions, options.parentSpan, fn);
}

/** Create a function to run a span preconfigured with a OpenTelemetry tracer. The function can take either a function
 * that returns a promise, or a promise itself. */
export function createSpanRunner(tracer: opentelemetry.Tracer) {
  return function runSpan<T>(
    options: RunInSpanOptions | string,
    fn: ((span: Span) => Promise<T>) | PromiseLike<T>
  ): Promise<T> {
    return runInSpan(tracer, options, fn);
  };
}

export function objectToSpanAttributeValues(
  o: object | null | undefined,
  prefix = ''
): Record<string, AttributeValue> | undefined {
  if (!o) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(o).map(([k, v]) => [prefix + k, toSpanAttributeValue(v)])
  );
}

export function toSpanAttributeValue(v: AttributeValue | object): AttributeValue {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return JSON.stringify(v);
  } else {
    return v;
  }
}

export function propagateSpanToRequest(req: Request) {
  let propagator = new W3CTraceContextPropagator();

  const setter = {
    set: (req: Request, headerName: string, headerValue: string) => {
      req.headers.set(headerName, headerValue);
    },
  };

  propagator.inject(opentelemetry.context.active(), req, setter);
}

export function getPropagatedSpanFromRequest(
  headers: ReadonlyMap<string, string | string[] | undefined>
) {
  let propagator = new W3CTraceContextPropagator();

  const getter = {
    keys: (headers: ReadonlyMap<string, string>) => {
      return [...headers.keys()];
    },
    get: (headers: ReadonlyMap<string, string>, headerName: string) => {
      return headers.get(headerName) ?? undefined;
    },
  };

  return propagator.extract(opentelemetry.context.active(), headers, getter);
}

export function formatSpanTrace(spans: SdkSpan[], indent = 0) {
  if (!spans.length) return '';

  const indentString = ' '.repeat(indent);
  const output: string[] = [`${indentString}Span trace:`];

  // Helper function to format a single span
  for (let span of spans) {
    output.push(`${indentString}  ${span.name}`);
    if (span.attributes && Object.keys(span.attributes).length > 0) {
      output.push(`${indentString}    attributes: ${JSON.stringify(span.attributes)}`);
    }
  }

  return output.join('\n');
}
