export type NetworkOperation = 'ranking' | 'history' | 'registration';

interface ScenarioDefinition {
  label: string;
  description: string;
  data?: 'empty' | 'many-pages';
  latency?: 'slow' | 'variable' | 'out-of-order';
  fault?: 'connection' | 'timeout' | 'bad-request' | 'server-error';
  operation?: NetworkOperation;
  acceptedTimeout?: boolean;
}

export const NETWORK_SCENARIOS = {
  success: {
    label: 'Success',
    description: 'Normal responses with sample captains.',
  },
  empty: {
    label: 'Empty lists',
    description: 'Hide fixtures. Registered matches still appear.',
    data: 'empty',
  },
  'many-pages': {
    label: 'Multiple pages',
    description: 'Add 24 demo matches for your captain.',
    data: 'many-pages',
  },
  slow: {
    label: 'Slow responses',
    description: 'Every response waits 1.5 seconds.',
    latency: 'slow',
  },
  variable: {
    label: 'Variable latency',
    description: 'Repeat a seeded sequence of response delays.',
    latency: 'variable',
  },
  'out-of-order': {
    label: 'Out-of-order responses',
    description: 'Odd pages wait 1.5 seconds; even pages wait 0.1 seconds.',
    latency: 'out-of-order',
  },
  timeout: {
    label: 'Timeout',
    description: 'Responses exceed the HTTP timeout.',
    fault: 'timeout',
  },
  connection: {
    label: 'Connection failure',
    description: 'Requests fail without an HTTP response.',
    fault: 'connection',
  },
  'bad-request': {
    label: 'HTTP 400',
    description: 'Reject requests with a client error.',
    fault: 'bad-request',
  },
  'server-error': {
    label: 'HTTP 500',
    description: 'All API requests return a server error.',
    fault: 'server-error',
  },
  'ranking-error': {
    label: 'Ranking unavailable',
    description: 'Only ranking requests return HTTP 500.',
    fault: 'server-error',
    operation: 'ranking',
  },
  'history-error': {
    label: 'History unavailable',
    description: 'Only history requests return HTTP 500.',
    fault: 'server-error',
    operation: 'history',
  },
  'accepted-timeout': {
    label: 'Timeout after acceptance',
    description:
      'Save each new match, then delay its first response beyond the timeout. Retries recover it.',
    acceptedTimeout: true,
  },
  'registration-offline': {
    label: 'Registration unavailable',
    description: 'Reject submissions with HTTP 500. Queries continue working.',
    fault: 'server-error',
    operation: 'registration',
  },
} satisfies Record<string, ScenarioDefinition>;

export type NetworkScenarioId = keyof typeof NETWORK_SCENARIOS;

export function isNetworkScenario(value: unknown): value is NetworkScenarioId {
  return typeof value === 'string' && Object.hasOwn(NETWORK_SCENARIOS, value);
}

export function getScenario(id: NetworkScenarioId): ScenarioDefinition {
  return NETWORK_SCENARIOS[id];
}
