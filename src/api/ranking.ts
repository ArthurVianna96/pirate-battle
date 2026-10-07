import { queryOptions } from '@tanstack/react-query';
import { apiClient } from './client';
import type { RankingQuery, RankingResponse } from './contracts';

export async function fetchRanking(query: RankingQuery, signal?: AbortSignal) {
  const response = await apiClient.get<RankingResponse>('/ranking', {
    params: {
      ...query.configuration,
      page: query.page,
      pageSize: query.pageSize,
    },
    signal,
  });
  return response.data;
}

export function rankingQueryOptions(query: RankingQuery) {
  return queryOptions({
    queryKey: ['ranking', query],
    queryFn: ({ signal }) => fetchRanking(query, signal),
  });
}
