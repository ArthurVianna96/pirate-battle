import { Application } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { createArena, loadArenaAssets } from './arena/index';
import { startGameLoop } from './gameLoop';
import { combatConfig } from './mechanics/combat';

function mountArena(
  app: Application,
  host: HTMLDivElement,
  textures: Awaited<ReturnType<typeof loadArenaAssets>>,
  onScoreChange: (score: number) => void,
  onHealthChange: (health: number) => void,
) {
  const arena = createArena(textures, app.screen.width, app.screen.height);
  app.stage.addChild(arena.container);
  app.canvas.setAttribute('aria-label', 'Naval battle arena');
  app.canvas.setAttribute('role', 'img');
  host.appendChild(app.canvas);
  app.render();
  return startGameLoop(app, arena, onScoreChange, onHealthChange);
}

export function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState<number>(combatConfig.playerHealth);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let cancelled = false;
    let initialized = false;
    let stopGameLoop: (() => void) | undefined;

    function destroy() {
      stopGameLoop?.();
      stopGameLoop = undefined;
      if (!initialized) return;
      initialized = false;
      app.destroy({ removeView: true }, { children: true });
    }

    async function initialize(host: HTMLDivElement) {
      try {
        const textures = await loadArenaAssets();
        if (cancelled) return;

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

        stopGameLoop = mountArena(app, host, textures, setScore, setHealth);
        setStatus('ready');
      } catch (error) {
        if (initialized) destroy();
        if (!cancelled) {
          console.error('Unable to initialize the arena.', error);
          setStatus('error');
        }
      }
    }

    void initialize(host);
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
      <p aria-live="polite">Score: {score}</p>
      <p aria-live="polite">
        Health: {health}/{combatConfig.playerHealth}
      </p>
      <div ref={hostRef} className="arena" />
      <p>
        Hold W or ↑ to move forward. A/D or ←/→ to turn. Space to fire forward.
        Q/E to fire left/right.
      </p>
      {status === 'loading' && <p role="status">Loading arena...</p>}
      {status === 'error' && (
        <div role="alert">
          <p>Unable to load game assets or start the arena. Try again.</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}
    </>
  );
}
