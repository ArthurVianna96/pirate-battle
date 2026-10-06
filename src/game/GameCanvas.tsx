import { Application, Assets, Sprite, type Texture } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import playerShipUrl from '../../assets/png/default/ships/ship_1.png?url';

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
        if (cancelled) return;

        const texture = await Assets.load<Texture>(playerShipUrl);

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

        if (cancelled) {
          destroy();
          return;
        }

        const ship = new Sprite({ texture, anchor: 0.5 });
        ship.position.set(app.screen.width / 2, app.screen.height / 2);
        app.stage.addChild(ship);

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
          <p>Unable to load the ship or start the arena. Try again.</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}
    </>
  );
}
