import type { MatchRecord } from '../api/contracts';
import { MATCH_FIXTURES } from './fixtures';
import { parseMatchRecord } from '../api/validation';

export const MOCK_MATCHES_STORAGE_KEY = 'pirate-battle.mock-matches';

export function loadMockMatches(): MatchRecord[] {
  try {
    const saved = localStorage.getItem(MOCK_MATCHES_STORAGE_KEY);
    const records: unknown = saved ? JSON.parse(saved) : undefined;
    if (Array.isArray(records)) {
      return records
        .map(parseMatchRecord)
        .filter((record) => record !== undefined);
    }
  } catch {
    return [...MATCH_FIXTURES];
  }
  return [...MATCH_FIXTURES];
}

export function saveMockMatches(records: MatchRecord[]) {
  localStorage.setItem(MOCK_MATCHES_STORAGE_KEY, JSON.stringify(records));
}
