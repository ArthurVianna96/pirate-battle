import { setupWorker } from 'msw/browser';
import { createHandlers } from './handlers';

export const worker = setupWorker(...createHandlers());

export async function startMocks() {
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledFrame: 'bypass',
    quiet: true,
  });
}
