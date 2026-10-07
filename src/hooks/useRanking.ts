import { useQuery } from '@tanstack/react-query';
import type { RankingQuery } from '../api/contracts';
import { rankingQueryOptions } from '../api/ranking';

export function useRanking(query: RankingQuery) {
  return useQuery(rankingQueryOptions(query));
}
