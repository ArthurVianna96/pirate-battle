import type {
  MatchRecord,
  PageRequest,
  PlayerIdentity,
} from '../api/contracts';
import {
  MATCH_CONFIG,
  type MatchResult,
  type MatchEndReason,
} from '../game/mechanics/match';
import { parseOptions } from '../game/support/options';

const PAGINATION_CONFIG = { defaultPageSize: 5, maxPageSize: 50 } as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function isScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isDuration(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MATCH_CONFIG.maxDuration
  );
}

function isEndReason(value: unknown): value is MatchEndReason {
  return value === 'time' || value === 'death';
}

function isCompletionDate(value: unknown): value is string {
  return isText(value) && Number.isFinite(Date.parse(value));
}

function parsePlayer(value: unknown): PlayerIdentity | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  if (!isText(value.id) || !isText(value.name)) {
    return undefined;
  }
  return { id: value.id, name: value.name };
}

function parseOutcome(
  record: Record<string, unknown>,
): MatchResult | undefined {
  if (!isScore(record.score)) {
    return undefined;
  }
  if (!isDuration(record.elapsedSeconds)) {
    return undefined;
  }
  if (!isEndReason(record.endReason)) {
    return undefined;
  }
  return {
    score: record.score,
    elapsedSeconds: record.elapsedSeconds,
    endReason: record.endReason,
  };
}

export function parsePage(params: URLSearchParams): PageRequest | undefined {
  const page = Number(params.get('page') ?? 1);
  const pageSize = Number(
    params.get('pageSize') ?? PAGINATION_CONFIG.defaultPageSize,
  );
  if (!isPositiveInteger(page) || !isPositiveInteger(pageSize)) {
    return undefined;
  }
  if (pageSize > PAGINATION_CONFIG.maxPageSize) {
    return undefined;
  }
  return { page, pageSize };
}

export function parseMatchRecord(value: unknown): MatchRecord | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  if (!isText(value.id) || !isCompletionDate(value.completedAt)) {
    return undefined;
  }
  const player = parsePlayer(value.player);
  const configuration = parseOptions(value.configuration);
  const outcome = parseOutcome(value);
  if (!player || !configuration || !outcome) {
    return undefined;
  }
  return {
    id: value.id,
    completedAt: value.completedAt,
    player,
    configuration,
    ...outcome,
  };
}
