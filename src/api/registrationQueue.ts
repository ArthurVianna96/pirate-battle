import type { MatchRecord } from './contracts';
import {
  loadPendingMatches,
  savePendingMatches,
} from '../storage/pendingMatches';

export type RegistrationStatus = 'idle' | 'pending' | 'error' | 'success';

interface RegistrationSnapshot {
  pending: MatchRecord[];
  statuses: Record<string, RegistrationStatus>;
  storageFailed: boolean;
}

export function createRegistrationQueue(
  send: (record: MatchRecord) => Promise<MatchRecord>,
) {
  let snapshot: RegistrationSnapshot = {
    pending: loadPendingMatches(),
    statuses: {},
    storageFailed: false,
  };
  const listeners = new Set<() => void>();
  const inFlight = new Map<string, Promise<void>>();

  function publish(changes: Partial<RegistrationSnapshot>) {
    snapshot = { ...snapshot, ...changes };
    listeners.forEach((listener) => listener());
  }

  function updatePending(pending: MatchRecord[]) {
    const saved = savePendingMatches(pending);
    publish({ pending, storageFailed: !saved });
  }

  function setStatus(id: string, status: RegistrationStatus) {
    publish({ statuses: { ...snapshot.statuses, [id]: status } });
  }

  function enqueue(record: MatchRecord) {
    const existing = snapshot.pending.find(
      (pending) => pending.id === record.id,
    );
    if (existing) {
      return existing;
    }
    updatePending([...snapshot.pending, record]);
    return record;
  }

  function confirm(record: MatchRecord) {
    updatePending(
      snapshot.pending.filter((pending) => pending.id !== record.id),
    );
    setStatus(record.id, 'success');
  }

  function submit(record: MatchRecord): Promise<void> {
    const currentRequest = inFlight.get(record.id);
    if (currentRequest) {
      return currentRequest;
    }
    if (snapshot.statuses[record.id] === 'success') {
      return Promise.resolve();
    }
    const pending = enqueue(record);
    setStatus(record.id, 'pending');
    const request = Promise.resolve()
      .then(() => send(pending))
      .then(
        () => confirm(pending),
        () => setStatus(pending.id, 'error'),
      )
      .finally(() => inFlight.delete(pending.id));
    inFlight.set(pending.id, request);
    return request;
  }

  function retryAll() {
    return Promise.all(snapshot.pending.map(submit));
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot() {
    return snapshot;
  }

  function clear() {
    if (inFlight.size > 0) {
      return false;
    }
    updatePending([]);
    publish({ statuses: {} });
    return true;
  }

  return { submit, retryAll, subscribe, getSnapshot, clear };
}
