// See https://kit.svelte.dev/docs/types#app

import type { ExternalToast } from 'svelte-sonner';

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      traceId: string;
      toast: (type: 'success' | 'error' | 'info', message: string, options?: ExternalToast) => void;
      flash: (type: 'success' | 'error' | 'info', message: string) => void;
    }
    interface PageData {
      heading?: string;
      flash?: {
        type: 'success' | 'error' | 'info';
        message: string;
        toast?: boolean;
        options?: ExternalToast;
      };
    }
    // interface PageState {}
    // interface Platform {}
  }

  interface Window {
    Rollbar: import('rollbar');
  }
}

export {};
