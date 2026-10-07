import axios, { type InternalAxiosRequestConfig } from 'axios';

export const HTTP_CONFIG = { timeout: 8_000 } as const;

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: HTTP_CONFIG.timeout,
});

interface MockRequestConfig extends InternalAxiosRequestConfig {
  mockRecoveryAttempted?: boolean;
}

apiClient.interceptors.request.use(async (request) => {
  if (typeof window !== 'undefined') {
    const { startMocks } = await import('../mocks/browser');
    await startMocks();
  }
  return request;
});

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || typeof window === 'undefined') {
    throw error;
  }
  const request = error.config as MockRequestConfig | undefined;
  if (
    error.response?.status !== 404 ||
    !request ||
    request.mockRecoveryAttempted
  ) {
    throw error;
  }
  request.mockRecoveryAttempted = true;
  const { restartMocks } = await import('../mocks/browser');
  await restartMocks();
  return apiClient.request(request);
});
