import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

export const QUERY_CONFIG = { staleTime: 30_000, retries: 2 } as const;

function shouldRetry(failureCount: number, error: Error) {
  if (failureCount >= QUERY_CONFIG.retries) {
    return false;
  }
  if (!isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  return status === undefined || status >= 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CONFIG.staleTime,
      retry: shouldRetry,
      refetchOnMount: 'always',
    },
  },
});
