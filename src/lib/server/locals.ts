import type { RequestEvent } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import type { ExternalToast } from 'svelte-sonner';

export function createLocalsServices(event: RequestEvent) {
  event.locals.toast = (
    type: 'success' | 'error' | 'info',
    message: string,
    options?: ExternalToast
  ) => {
    setFlash(
      {
        type,
        message,
        toast: true,
        options,
      },
      event
    );
  };

  event.locals.flash = (type: 'success' | 'error' | 'info', message: string) => {
    setFlash(
      {
        type,
        message,
      },
      event
    );
  };
}
