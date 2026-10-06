import { Application } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';

export function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let cancelled = false;
    let initialized = false;

    function destroy() {
      if (!initialized) return;
      initialized = false;
      app.destroy({ removeView: true }, { children: true });
    }

    async function initialize() {
      try {
        await app.init({
          width: 960,
          height: 540,
          background: '#126b86',
          preference: 'webgl',
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          autoStart: false,
          sharedTicker: false,
        });
        initialized = true;

        // React may unmount this effect before asynchronous init finishes.
        if (cancelled) {
          destroy();
          return;
        }

        app.canvas.setAttribute('aria-label', 'Naval battle arena');
        app.canvas.setAttribute('role', 'img');
        host!.appendChild(app.canvas);
        app.render();
        setStatus('ready');
      } catch (error) {
        if (initialized) destroy();
        if (!cancelled) {
          console.error('Unable to initialize the arena.', error);
          setStatus('error');
        }
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      destroy();
    };
  }, [attempt]);

  function retry() {
    setStatus('loading');
    setAttempt((value) => value + 1);
  }

  return (
    <>
      <div ref={hostRef} className="arena" />
      {status === 'loading' && <p role="status">Loading arena...</p>}
      {status === 'error' && (
        <div role="alert">
          <p>Unable to start the arena. Try again.</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}
    </>
  );
}
