import { queryOptions } from '@tanstack/react-query';
import { apiClient } from './client';
import type { MatchHistoryQuery, MatchHistoryResponse } from './contracts';

export async function fetchMatchHistory(
  query: MatchHistoryQuery,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<MatchHistoryResponse>('/matches', {
    params: query,
    signal,
  });
  return response.data;
}

export function historyQueryOptions(query: MatchHistoryQuery) {
  return queryOptions({
    queryKey: ['match-history', query],
    queryFn: ({ signal }) => fetchMatchHistory(query, signal),
  });
}
