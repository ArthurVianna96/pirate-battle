import type { MatchResult } from '../game/mechanics/match';
import { MATCH_CONFIG } from '../game/mechanics/match';

export const RESULT_STORAGE_KEY = 'pirate-battle.last-result';

export function loadLastResult(): MatchResult | undefined {
  try {
    const saved = localStorage.getItem(RESULT_STORAGE_KEY);
    if (!saved) {
      return undefined;
    }
    const result: unknown = JSON.parse(saved);
    if (!result || typeof result !== 'object') {
      return undefined;
    }
    const { score, elapsedSeconds, endReason } = result as Partial<MatchResult>;
    if (
      typeof score !== 'number' ||
      !Number.isSafeInteger(score) ||
      score < 0 ||
      typeof elapsedSeconds !== 'number' ||
      !Number.isFinite(elapsedSeconds) ||
      elapsedSeconds < 0 ||
      elapsedSeconds > MATCH_CONFIG.maxDuration ||
      (endReason !== 'time' && endReason !== 'death')
    ) {
      return undefined;
    }
    return { score, elapsedSeconds, endReason };
  } catch {
    return undefined;
  }
}

export function saveLastResult(result: MatchResult): boolean {
  try {
    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
    return true;
  } catch {
    return false;
  }
}
