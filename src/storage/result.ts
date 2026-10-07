import type { MatchResult } from '../game/mechanics/match';
import { parseMatchResult } from '../api/validation';

export const RESULT_STORAGE_KEY = 'pirate-battle.last-result';

export function loadLastResult(): MatchResult | undefined {
  try {
    const saved = localStorage.getItem(RESULT_STORAGE_KEY);
    if (!saved) {
      return undefined;
    }
    return parseMatchResult(JSON.parse(saved));
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
