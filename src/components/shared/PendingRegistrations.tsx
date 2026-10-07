interface PendingRegistrationsProps {
  count: number;
  sending: boolean;
  storageFailed: boolean;
  onRetry: () => void;
}

export function PendingRegistrations({
  count,
  sending,
  storageFailed,
  onRetry,
}: PendingRegistrationsProps) {
  if (count === 0) {
    return null;
  }
  return (
    <aside className="pending-registrations" aria-label="Pending registrations">
      <p role="status">
        {count} {count === 1 ? 'match awaits' : 'matches await'} registration.
      </p>
      {storageFailed && (
        <p role="alert">
          Pending matches could not be saved locally. Keep this page open to
          retry.
        </p>
      )}
      <button disabled={sending} onClick={onRetry}>
        {sending ? 'Recording matches…' : 'Retry pending matches'}
      </button>
    </aside>
  );
}
