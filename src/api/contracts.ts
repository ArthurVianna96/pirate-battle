import type { MatchResult } from '../game/mechanics/match';
import type { GameOptions } from '../game/support/options';

export interface PlayerIdentity {
  id: string;
  name: string;
}

export interface MatchRecord extends MatchResult {
  id: string;
  player: PlayerIdentity;
  completedAt: string;
  configuration: GameOptions;
}

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<Item> extends PageRequest {
  items: Item[];
  totalItems: number;
}

export interface RankingQuery extends PageRequest {
  configuration: GameOptions;
}

export interface RankingEntry extends MatchRecord {
  rank: number;
}

export interface MatchHistoryQuery extends PageRequest {
  playerId: string;
}

export type MatchHistoryResponse = PaginatedResponse<MatchRecord>;
export type RankingResponse = PaginatedResponse<RankingEntry>;

export interface RegisterMatchResponse {
  match: MatchRecord;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
}
