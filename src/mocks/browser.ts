import { setupWorker } from 'msw/browser';
import { createHandlers } from './handlers';
import { store, networkScenario } from './state';

let worker = setupWorker(...createHandlers(store, networkScenario));
let activated = false;
let startup: Promise<void> | undefined;

async function activateWorker() {
  try {
    await worker.start({
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      onUnhandledRequest: 'bypass',
      quiet: true,
    });
    activated = true;
  } catch (error) {
    resetWorker();
    throw error;
  }
}

function resetWorker() {
  worker.stop();
  activated = false;
  worker = setupWorker(...createHandlers(store, networkScenario));
}

export function startMocks(): Promise<void> {
  if (startup) {
    return startup;
  }
  if (activated) {
    return Promise.resolve();
  }
  startup = activateWorker().finally(() => {
    startup = undefined;
  });
  return startup;
}

export function restartMocks(): Promise<void> {
  if (startup) {
    return startup;
  }
  startup = (async () => {
    resetWorker();
    await activateWorker();
  })().finally(() => {
    startup = undefined;
  });
  return startup;
}
