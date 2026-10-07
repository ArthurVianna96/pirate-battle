import { expect, test } from '@playwright/test';
import { setupServer } from 'msw/node';
import { apiClient } from '../src/api/client';
import { fetchRanking, rankingQueryOptions } from '../src/api/ranking';
import { QueryClient } from '@tanstack/react-query';
import { fetchMatchHistory } from '../src/api/history';
import { registerMatch } from '../src/api/registration';
import { createHandlers } from '../src/mocks/handlers';
import { createNetworkScenario } from '../src/mocks/network';
import { createMatchStore } from '../src/mocks/store';
import type { MatchRecord } from '../src/api/contracts';

const PLAYER = { id: 'local-player', name: 'Test Captain' };
const RECORD: MatchRecord = {
  id: 'network-match',
  player: PLAYER,
  completedAt: '2026-01-02T12:00:00.000Z',
  score: 10,
  elapsedSeconds: 60,
  endReason: 'time',
  configuration: { sessionDuration: 60, enemySpawnInterval: 4 },
};
const RANKING = { page: 1, pageSize: 5, configuration: RECORD.configuration };
const HISTORY = { page: 1, pageSize: 5, playerId: PLAYER.id };
const TIMING = { slow: 60, fast: 5, variable: [40, 5, 20], timeout: 60 };
const server = setupServer();
let store = createMatchStore();
let network = createNetworkScenario();

test.beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
test.afterAll(() => server.close());
test.beforeEach(() => {
  apiClient.defaults.baseURL = 'http://localhost/api';
  apiClient.defaults.timeout = 1_000;
  store = createMatchStore();
  network = createNetworkScenario({ id: 'success', seed: 0 }, PLAYER, TIMING);
  server.resetHandlers(...createHandlers(store, network));
});

test('empty and multiple-page scenarios remain consistent between ranking and history', async () => {
  network.select('many-pages');
  expect((await fetchRanking(RANKING)).totalItems).toBe(30);
  expect((await fetchMatchHistory(HISTORY)).totalItems).toBe(24);
  network.select('empty');
  expect((await fetchRanking(RANKING)).items).toEqual([]);
  await registerMatch(RECORD);
  expect((await fetchRanking(RANKING)).totalItems).toBe(1);
  expect((await fetchMatchHistory(HISTORY)).items).toEqual([RECORD]);
});

test('targeted outages affect only their selected operations', async () => {
  network.select('ranking-error');
  await expect(fetchRanking(RANKING)).rejects.toMatchObject({
    response: { status: 500 },
  });
  expect((await fetchMatchHistory(HISTORY)).items).toEqual([]);
  network.select('history-error');
  await expect(fetchMatchHistory(HISTORY)).rejects.toMatchObject({
    response: { status: 500 },
  });
  expect((await fetchRanking(RANKING)).totalItems).toBe(6);
  network.select('registration-offline');
  await expect(registerMatch(RECORD)).rejects.toMatchObject({
    response: { status: 500 },
  });
  expect(store.has(RECORD.id)).toBe(false);
  network.select('success');
  expect(await registerMatch(RECORD)).toEqual(RECORD);
});

test('HTTP, connection, and timeout failures use the real HTTP client', async () => {
  network.select('bad-request');
  await expect(fetchRanking(RANKING)).rejects.toMatchObject({
    response: { status: 400 },
  });
  network.select('server-error');
  await expect(fetchRanking(RANKING)).rejects.toMatchObject({
    response: { status: 500 },
  });
  network.select('connection');
  await expect(fetchRanking(RANKING)).rejects.toThrow();
  network.select('timeout');
  apiClient.defaults.timeout = 20;
  await expect(fetchRanking(RANKING)).rejects.toMatchObject({
    code: 'ECONNABORTED',
  });
});

test('acceptance followed by timeout recovers the existing record', async () => {
  network.select('accepted-timeout');
  apiClient.defaults.timeout = 20;
  await expect(registerMatch(RECORD)).rejects.toMatchObject({
    code: 'ECONNABORTED',
  });
  expect(store.has(RECORD.id)).toBe(true);
  expect(await registerMatch(RECORD)).toEqual(RECORD);
  expect(store.list().filter((record) => record.id === RECORD.id)).toHaveLength(
    1,
  );
});

test('out-of-order and seeded latency scenarios repeat their response order', async () => {
  network.select('out-of-order');
  const pages: number[] = [];
  await Promise.all(
    [1, 2].map(async (page) => {
      const result = await fetchRanking({ ...RANKING, page });
      pages.push(result.page);
    }),
  );
  expect(pages).toEqual([2, 1]);
  async function runSequence() {
    network.select('variable', 0);
    const order: number[] = [];
    await Promise.all(
      [1, 2, 3].map(async (page) => {
        await fetchRanking({ ...RANKING, page });
        order.push(page);
      }),
    );
    return order;
  }
  expect(await runSequence()).toEqual([2, 3, 1]);
  expect(await runSequence()).toEqual([2, 3, 1]);
});

test('a cancelled old response cannot replace a newer query result', async () => {
  network.select('variable', 0);
  let started!: () => void;
  const firstStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  let oldResponse!: Promise<Response>;
  let requests = 0;
  server.resetHandlers(
    ...createHandlers(store, {
      ...network,
      respond(operation, context, success) {
        const response = network.respond(operation, context, success);
        if (operation === 'ranking' && requests++ === 0) {
          oldResponse = response;
          started();
        }
        return response;
      },
    }),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const options = rankingQueryOptions(RANKING);
  try {
    const old = client.fetchQuery(options).catch(() => undefined);
    await firstStarted;
    store.register(RECORD);
    await client.cancelQueries({ queryKey: options.queryKey });
    const current = await client.fetchQuery(options);
    expect(current.totalItems).toBe(7);
    await oldResponse;
    await old;
    expect(client.getQueryData(options.queryKey)).toEqual(current);
  } finally {
    client.clear();
  }
});
