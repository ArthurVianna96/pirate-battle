import { expect, test } from '@playwright/test';
import { QueryClient } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { apiClient } from '../src/api/client';
import { rankingQueryOptions, fetchRanking } from '../src/api/ranking';
import { historyQueryOptions } from '../src/api/history';
import { createHandlers } from '../src/mocks/handlers';

const server = setupServer(...createHandlers());

test.beforeAll(() => {
  apiClient.defaults.baseURL = 'http://localhost/api';
  server.listen({ onUnhandledRequest: 'error' });
});

test.afterAll(() => server.close());

test('Axios and Query keep ranking pages and configurations in separate cache entries', async () => {
  const client = new QueryClient();
  try {
    const query = {
      page: 1,
      pageSize: 2,
      configuration: {
        sessionDuration: 60,
        enemySpawnInterval: 4,
      },
    };
    const firstOptions = rankingQueryOptions(query);
    const secondOptions = rankingQueryOptions({ ...query, page: 2 });
    const otherOptions = rankingQueryOptions({
      ...query,
      configuration: { ...query.configuration, sessionDuration: 120 },
    });
    const first = await client.fetchQuery(firstOptions);
    const second = await client.fetchQuery(secondOptions);
    const other = await client.fetchQuery(otherOptions);
    expect(first.items.map((entry) => entry.rank)).toEqual([1, 2]);
    expect(second.items.map((entry) => entry.rank)).toEqual([3, 4]);
    expect(other.items).toEqual([]);
    expect(client.getQueryData(firstOptions.queryKey)).toEqual(first);
    expect(client.getQueryData(secondOptions.queryKey)).toEqual(second);
  } finally {
    client.clear();
  }
});

test('history queries are scoped to the requested player', async () => {
  const client = new QueryClient();
  try {
    const first = await client.fetchQuery(
      historyQueryOptions({ playerId: 'player-1', page: 1, pageSize: 5 }),
    );
    const second = await client.fetchQuery(
      historyQueryOptions({ playerId: 'unknown-player', page: 1, pageSize: 5 }),
    );
    expect(first.items).toHaveLength(1);
    expect(first.items[0].player.id).toBe('player-1');
    expect(second.items).toEqual([]);
  } finally {
    client.clear();
  }
});

test('Axios exposes invalid requests and honors cancellation', async () => {
  const query = {
    page: 0,
    pageSize: 5,
    configuration: {
      sessionDuration: 60,
      enemySpawnInterval: 4,
    },
  };
  await expect(fetchRanking(query)).rejects.toMatchObject({
    response: { status: 400 },
  });
  const controller = new AbortController();
  controller.abort();
  await expect(
    fetchRanking({ ...query, page: 1 }, controller.signal),
  ).rejects.toMatchObject({ code: 'ERR_CANCELED' });
});
