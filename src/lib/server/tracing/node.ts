import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { initAncestorSpanProcessor } from './tracking.js';

// For debugging autoinstrumentation
// import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

export type TracingTarget = 'honeycomb' | 'jaeger';

export function createTracingConfig(env: Record<string, string | undefined>) {
  return {
    target: (env.TRACING_TARGET || 'jaeger') as TracingTarget,
    jaegerHost: env.JAEGER_URL || 'http://localhost:4318',
    honeycombApiKey: env.HONEYCOMB_API_KEY
  };
}

export function createTracingExporter(tracingConfig: ReturnType<typeof createTracingConfig>) {
  if (tracingConfig.target === 'honeycomb') {
    if (!tracingConfig.honeycombApiKey) {
      throw new Error('Missing Honeycomb API key');
    }

    return new OTLPTraceExporter({
      url: 'https://api.honeycomb.io/v1/traces',
      headers: {
        'x-honeycomb-team': tracingConfig.honeycombApiKey
      }
    });
  } else if (tracingConfig.target === 'jaeger') {
    return new OTLPTraceExporter({
      url: `${tracingConfig.jaegerHost}/v1/traces`
    });
  } else {
    // The type is `never` but the whole point of this error is that type safety failed, so don't let lint complain.
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Unknown tracing target: ${tracingConfig.target}`);
  }
}

let sdk: ReturnType<typeof initTracing> | undefined;
export function initTracing(
  serviceName: string,
  env: Record<string, string | undefined>
): { start: () => void; shutdown: () => Promise<void> } {
  if (process.env.CI) {
    return {
      start: () => {},
      shutdown: () => Promise.resolve()
    };
  }

  if (sdk) {
    return sdk;
  }

  const config = createTracingConfig(env);
  const exporter = createTracingExporter(config);

  const trackSpans =
    env.TRACK_SPANS === 'true' || (env.NODE_ENV || 'development') === 'development';

  const spanProcessors = [
    new BatchSpanProcessor(exporter),
    trackSpans ? initAncestorSpanProcessor() : undefined
  ].filter((e) => e != null);

  sdk = new NodeSDK({
    traceExporter: exporter,
    spanProcessors,
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serviceName
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // we recommend disabling fs autoinstrumentation since it can be noisy
        // and expensive during startup
        '@opentelemetry/instrumentation-fs': {
          enabled: false
        },
        '@opentelemetry/instrumentation-pg': {
          enhancedDatabaseReporting: true
        }
      })
    ]
  });

  return sdk;
}
