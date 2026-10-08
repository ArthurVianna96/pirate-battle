import { useEffect, useState } from 'react';
import { loadArenaAssets } from '../game/arena/assets';
import { preloadSounds } from '../game/support/audio';

export function useArenaPreload() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function preload() {
      try {
        await loadArenaAssets((value) => {
          if (!cancelled) {
            setProgress(value);
          }
        });
        if (cancelled) {
          return;
        }
        setStatus('ready');
        preloadSounds();
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    }

    void preload();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setStatus('loading');
    setProgress(0);
    setAttempt((value) => value + 1);
  }

  return { status, progress, retry };
}
