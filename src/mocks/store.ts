import type { MatchRecord } from '../api/contracts';
import { MATCH_FIXTURES } from './fixtures';

export function createMatchStore(initialRecords = MATCH_FIXTURES) {
  const records = new Map(initialRecords.map((record) => [record.id, record]));

  function register(record: MatchRecord) {
    const existing = records.get(record.id);
    if (existing) {
      return existing;
    }
    records.set(record.id, record);
    return record;
  }

  function list() {
    return [...records.values()];
  }

  return { register, list };
}
