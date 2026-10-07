import { apiClient } from './client';
import type { MatchRecord, RegisterMatchResponse } from './contracts';

export async function registerMatch(record: MatchRecord) {
  const response = await apiClient.post<RegisterMatchResponse>(
    '/matches',
    record,
  );
  return response.data.match;
}
