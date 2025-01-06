import { type SpanProcessor, Span } from '@opentelemetry/sdk-trace-base';
import * as api from '@opentelemetry/api';

export class AncestorSpanProcessor implements SpanProcessor {
  private spanMap = new Map<string, Span>();

  onStart(span: Span, _parentContext: api.Context): void {
    this.spanMap.set(span.spanContext().spanId, span);
  }

  onEnd(span: Span): void {
    this.spanMap.delete(span.spanContext().spanId);
  }

  getAncestorSpans(currentSpanId: string): Span[] {
    let spans: Span[] = [];

    let nextSpanId: string | undefined = currentSpanId;

    while (nextSpanId) {
      let span = this.spanMap.get(nextSpanId);
      if (!span) {
        break;
      }

      spans.push(span);
      nextSpanId = span.parentSpanId;
    }

    return spans;
  }

  shutdown(): Promise<void> {
    this.spanMap.clear();
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}

const ancestorSpanSymbol = Symbol.for('ancestorSpanProcessor');
export function initAncestorSpanProcessor() {
  // @ts-expect-error No typing for this
  const existing = globalThis[ancestorSpanSymbol] as AncestorSpanProcessor | undefined;
  if (existing) {
    return existing;
  }

  const ancestorSpanProcessor = new AncestorSpanProcessor();
  // @ts-expect-error No typing for this
  globalThis[ancestorSpanSymbol] = ancestorSpanProcessor;
  return ancestorSpanProcessor;
}

/** Get the ancestor span processor if it is configured. */
export function getAncestorSpanProcessor(): AncestorSpanProcessor | undefined {
  // @ts-expect-error No typing for this
  return globalThis[ancestorSpanSymbol] as AncestorSpanProcessor | undefined;
}
