import axios from 'axios';

export const HTTP_CONFIG = { timeout: 8_000 } as const;

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: HTTP_CONFIG.timeout,
});
