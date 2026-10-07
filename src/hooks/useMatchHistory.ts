import { useQuery } from '@tanstack/react-query';
import type { MatchHistoryQuery } from '../api/contracts';
import { historyQueryOptions } from '../api/history';

export function useMatchHistory(query: MatchHistoryQuery) {
  return useQuery(historyQueryOptions(query));
}
