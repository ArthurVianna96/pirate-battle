import type { MatchRecord } from '../api/contracts';
import { MATCH_FIXTURES } from './fixtures';

export function createMatchStore(
  initialRecords = MATCH_FIXTURES,
  saveRecords?: (records: MatchRecord[]) => void,
) {
  const records = new Map(initialRecords.map((record) => [record.id, record]));

  function register(record: MatchRecord) {
    const existing = records.get(record.id);
    if (existing) {
      return existing;
    }
    saveRecords?.([...records.values(), record]);
    records.set(record.id, record);
    return record;
  }

  function list() {
    return [...records.values()];
  }

  function has(id: string) {
    return records.has(id);
  }

  function reset() {
    saveRecords?.([...MATCH_FIXTURES]);
    records.clear();
    MATCH_FIXTURES.forEach((record) => records.set(record.id, record));
  }

  return { register, list, has, reset };
}
