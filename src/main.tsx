import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
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
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void startApplication();
