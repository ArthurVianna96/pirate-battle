import { MATCH_CONFIG } from '../mechanics/match';
import { SPAWN_CONFIG } from '../mechanics/spawning';

export interface GameOptions {
  readonly sessionDuration: number;
  readonly enemySpawnInterval: number;
}

export const OPTIONS_CONFIG = {
  minSpawnInterval: 1,
  maxSpawnInterval: 30,
} as const;

export const DEFAULT_OPTIONS: GameOptions = {
  sessionDuration: MATCH_CONFIG.duration,
  enemySpawnInterval: SPAWN_CONFIG.interval,
};

export function isDurationValid(value: unknown): value is number {
  return isWholeSecondsInRange(
    value,
    MATCH_CONFIG.minDuration,
    MATCH_CONFIG.maxDuration,
  );
}

export function isSpawnIntervalValid(value: unknown): value is number {
  return isWholeSecondsInRange(
    value,
    OPTIONS_CONFIG.minSpawnInterval,
    OPTIONS_CONFIG.maxSpawnInterval,
  );
}

function isWholeSecondsInRange(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

export function parseOptions(value: unknown): GameOptions | null {
  if (
    !value ||
    typeof value !== 'object' ||
    !('sessionDuration' in value) ||
    !('enemySpawnInterval' in value)
  ) {
    return null;
  }
  const { sessionDuration, enemySpawnInterval } = value;
  if (
    !isDurationValid(sessionDuration) ||
    !isSpawnIntervalValid(enemySpawnInterval)
  ) {
    return null;
  }
  return { sessionDuration, enemySpawnInterval };
}

export function createOptionsSnapshot(options: GameOptions): GameOptions {
  const validated = parseOptions(options);
  if (!validated) {
    throw new Error('Unable to start a match with invalid options.');
  }
  return Object.freeze(validated);
}
