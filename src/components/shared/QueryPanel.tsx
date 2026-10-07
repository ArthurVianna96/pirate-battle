import type { ReactNode } from 'react';

interface QueryPanelProps {
  pending: boolean;
  failed: boolean;
  refreshing: boolean;
  hasData: boolean;
  onRetry: () => void;
  children: ReactNode;
}

export function QueryPanel({
  pending,
  failed,
  refreshing,
  hasData,
  onRetry,
  children,
}: QueryPanelProps) {
  if (pending) {
    return <p role="status">Loading records…</p>;
  }
  return (
    <>
      {failed && (
        <div role="alert">
          <p>Could not load records. You can still play.</p>
          <button onClick={onRetry}>Retry</button>
        </div>
      )}
      {refreshing && <p role="status">Updating records…</p>}
      {hasData && children}
    </>
  );
}
