import { useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  networkScenario,
  selectNetworkScenario,
  resetNetworkState,
} from '../../mocks/state';
import {
  NETWORK_SCENARIOS,
  isNetworkScenario,
  type NetworkScenarioId,
} from '../../mocks/scenarios';

interface NetworkControlsProps {
  sending: boolean;
  onResetPending: () => boolean;
}

export function NetworkControls({
  sending,
  onResetPending,
}: NetworkControlsProps) {
  const state = useSyncExternalStore(
    networkScenario.subscribe,
    networkScenario.getSnapshot,
  );
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const enabled =
    new URLSearchParams(location.search).has('network') ||
    state.id !== 'success';

  async function refreshQueries(action: () => void) {
    setBusy(true);
    setFailed(false);
    try {
      await client.cancelQueries({ queryKey: ['ranking'] });
      await client.cancelQueries({ queryKey: ['match-history'] });
      action();
      await Promise.all([
        client.resetQueries({ queryKey: ['ranking'] }),
        client.resetQueries({ queryKey: ['match-history'] }),
      ]);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  function selectScenario(id: string) {
    if (isNetworkScenario(id)) {
      void refreshQueries(() => selectNetworkScenario(id));
    }
  }

  function reset() {
    void refreshQueries(() => {
      resetNetworkState();
      onResetPending();
    });
  }

  if (!enabled) {
    return null;
  }
  return (
    <details className="network-controls">
      <summary>Network simulation</summary>
      <label htmlFor="network-scenario">Scenario</label>
      <select
        id="network-scenario"
        value={state.id}
        disabled={busy}
        onChange={(event) => selectScenario(event.target.value)}
      >
        {(Object.keys(NETWORK_SCENARIOS) as NetworkScenarioId[]).map((id) => (
          <option key={id} value={id}>
            {NETWORK_SCENARIOS[id].label}
          </option>
        ))}
      </select>
      <p>
        {NETWORK_SCENARIOS[state.id].description} Seed: {state.seed}.
      </p>
      <p>
        Reset clears confirmed and pending demo matches and restores Success.
      </p>
      <button disabled={busy || sending} onClick={reset}>
        Reset network state
      </button>
      {failed && <p role="alert">Could not reset network data.</p>}
    </details>
  );
}
