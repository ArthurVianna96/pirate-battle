import { expect, test } from '@playwright/test';
import type { MatchRecord } from '../src/api/contracts';
import { createRegistrationQueue } from '../src/api/registrationQueue';
import { createMatchStore } from '../src/mocks/store';
import { loadPendingMatches } from '../src/storage/pendingMatches';

const RECORD: MatchRecord = {
  id: 'pending-1',
  player: { id: 'test-player', name: 'Captain' },
  completedAt: '2026-01-01T12:00:00.000Z',
  score: 7,
  elapsedSeconds: 60,
  endReason: 'time',
  configuration: { sessionDuration: 60, enemySpawnInterval: 4 },
};

test.beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
});

test('pending payload is saved before sending and duplicate clicks share one request', async () => {
  let finish!: (record: MatchRecord) => void;
  let sends = 0;
  const response = new Promise<MatchRecord>((resolve) => {
    finish = resolve;
  });
  const queue = createRegistrationQueue(async () => {
    sends++;
    expect(loadPendingMatches()).toEqual([RECORD]);
    return response;
  });
  const first = queue.submit(RECORD);
  const second = queue.submit(RECORD);
  expect(first).toBe(second);
  await Promise.resolve();
  expect(sends).toBe(1);
  finish(RECORD);
  await first;
  expect(loadPendingMatches()).toEqual([]);
  await queue.submit(RECORD);
  expect(sends).toBe(1);
});

test('a lost response recovers the accepted record after recreating the queue', async () => {
  const store = createMatchStore([]);
  const failed = createRegistrationQueue(async (record) => {
    store.register(record);
    throw new Error('Response lost after acceptance');
  });
  await failed.submit(RECORD);
  expect(loadPendingMatches()).toEqual([RECORD]);
  const recovered = createRegistrationQueue(async (record) =>
    store.register(record),
  );
  await recovered.retryAll();
  expect(store.list()).toEqual([RECORD]);
  expect(loadPendingMatches()).toEqual([]);
});

test('out-of-order confirmations preserve other pending matches', async () => {
  const finishes = new Map<string, (record: MatchRecord) => void>();
  const queue = createRegistrationQueue(
    (record) =>
      new Promise((resolve) => {
        finishes.set(record.id, resolve);
      }),
  );
  const other = { ...RECORD, id: 'pending-2' };
  const first = queue.submit(RECORD);
  const second = queue.submit(other);
  await Promise.resolve();
  finishes.get(other.id)!(other);
  await second;
  expect(loadPendingMatches()).toEqual([RECORD]);
  finishes.get(RECORD.id)!(RECORD);
  await first;
  expect(loadPendingMatches()).toEqual([]);
});
