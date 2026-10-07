import type { MatchRecord } from '../api/contracts';
import { parseMatchRecord } from '../api/validation';

export const PENDING_MATCHES_STORAGE_KEY = 'pirate-battle.pending-matches';

export function loadPendingMatches(): MatchRecord[] {
  try {
    const saved = localStorage.getItem(PENDING_MATCHES_STORAGE_KEY);
    const records: unknown = saved ? JSON.parse(saved) : undefined;
    if (!Array.isArray(records)) {
      return [];
    }
    const validRecords = records
      .map(parseMatchRecord)
      .filter((record) => record !== undefined);
    return [
      ...new Map(validRecords.map((record) => [record.id, record])).values(),
    ];
  } catch {
    return [];
  }
}

export function savePendingMatches(records: MatchRecord[]): boolean {
  try {
    localStorage.setItem(PENDING_MATCHES_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}
