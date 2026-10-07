import { Application } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { createArena, loadArenaAssets } from './arena/index';
import {
  startGameLoop,
  type GameLoopCallbacks,
  type GameLoopController,
} from './gameLoop';
import { COMBAT_CONFIG } from './mechanics/combat';
import { MATCH_CONFIG, type MatchResult } from './mechanics/match';

function mountArena(
  app: Application,
  host: HTMLDivElement,
  textures: Awaited<ReturnType<typeof loadArenaAssets>>,
  callbacks: GameLoopCallbacks,
) {
  const arena = createArena(textures, app.screen.width, app.screen.height);
  app.stage.addChild(arena.container);
  app.canvas.setAttribute('aria-label', 'Naval battle arena');
  app.canvas.setAttribute('role', 'img');
  host.appendChild(app.canvas);
  app.render();
  return startGameLoop(app, arena, callbacks);
}

export function GameCanvas({
  onMatchEnd,
}: {
  onMatchEnd: (result: MatchResult) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<GameLoopController | null>(null);
  const pauseButtonRef = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState<number>(COMBAT_CONFIG.playerHealth);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    MATCH_CONFIG.duration,
  );
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let cancelled = false;
    let initialized = false;
    let gameLoop: GameLoopController | undefined;

    function destroy() {
      gameLoop?.destroy();
      if (gameLoopRef.current === gameLoop) gameLoopRef.current = null;
      gameLoop = undefined;
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

        gameLoop = mountArena(app, host, textures, {
          onScoreChange: setScore,
          onHealthChange: setHealth,
          onTimeChange: setRemainingSeconds,
          onMatchEnd,
          onPauseChange(value) {
            setPaused(value);
            requestAnimationFrame(() => pauseButtonRef.current?.focus());
          },
        });
        gameLoopRef.current = gameLoop;
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
  }, [attempt, onMatchEnd]);

  function retry() {
    setStatus('loading');
    setAttempt((value) => value + 1);
  }

  function togglePause() {
    if (paused) gameLoopRef.current?.resume();
    else gameLoopRef.current?.pause();
  }

  return (
    <>
      <p aria-live="polite">Score: {score}</p>
      <p aria-live="polite">
        Health: {health}/{COMBAT_CONFIG.playerHealth}
      </p>
      <p>Time: {remainingSeconds}s</p>
      <button
        ref={pauseButtonRef}
        onClick={togglePause}
        disabled={status !== 'ready'}
      >
        {paused ? 'Resume' : 'Pause'}
      </button>
      <div ref={hostRef} className="arena" />
      {paused && <p role="status">Game paused. Select Resume to continue.</p>}
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
