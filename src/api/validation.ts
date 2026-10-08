import { MATCH_CONFIG } from '../game/config';
import type { MatchRecord, PlayerIdentity } from './contracts';
import { type MatchResult, type MatchEndReason } from '../game/mechanics/match';
import { parseOptions } from '../game/support/options';

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
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

export function parseMatchResult(value: unknown): MatchResult | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  const record = value;
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

export function parseMatchRecord(value: unknown): MatchRecord | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  if (!isText(value.id) || !isCompletionDate(value.completedAt)) {
    return undefined;
  }
  const player = parsePlayer(value.player);
  const configuration = parseOptions(value.configuration);
  const outcome = parseMatchResult(value);
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
