import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

async function startApplication() {
  try {
    const { startMocks } = await import('./mocks/browser');
    await startMocks();
  } catch {
    console.warn('API mocks unavailable. Local gameplay remains available.');
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void startApplication();
