import debugModule from 'debug';

const debug = debugModule('graceful_shutdown');

export async function shutdownWithTimeout(service: ShutdownService) {
  try {
    debug('Shutdown %s', service.name);
    await Promise.race([
      service.shutdown(),
      new Promise((_, reject) => {
        let timer = setTimeout(
          () => reject(new Error('Shutdown timeout')),
          service.timeout || 5000
        );
        // Don't wait for this timer to quit
        timer.unref();
      })
    ]);

    debug('Shutdown %s done', service.name);
  } catch (e) {
    if ((e as Error).message === 'Shutdown timeout') {
      console.error(`Shutdown timeout for ${service.name}`);
    } else {
      console.error(e);
    }
  }
}

export interface ShutdownService {
  name: string;
  timeout?: number;
  shutdown: () => Promise<any>;
}

export function wrapShutdownCallback(): {
  promise: Promise<void>;
  cb: (err: Error | null | undefined) => void;
} {
  let { promise, resolve, reject } = Promise.withResolvers<void>();

  return {
    promise,
    cb: (err: Error | null | undefined) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }
  };
}

export class GracefulShutdown {
  services: ShutdownService[] = [];

  shuttingDownPromise: Promise<any> | null = null;

  /** Add a service to shutdown */
  add(service: ShutdownService) {
    this.services.push(service);
  }

  /* Register SIGINT and SIGTERM signal handlers to call shutdown */
  registerSignals() {
    process.on('SIGINT', () => void this.shutdown());
    process.on('SIGTERM', () => void this.shutdown());
  }

  /** Shutdown all services */
  shutdown() {
    if (this.shuttingDownPromise) {
      return this.shuttingDownPromise;
    }
    debug('Shutting down');
    this.shuttingDownPromise = Promise.allSettled(this.services.map((s) => shutdownWithTimeout(s)));
    return this.shuttingDownPromise;
  }
}
