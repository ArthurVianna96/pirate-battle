import { Hud } from './Hud';
import { GameControls } from './GameControls';
import { createInputState } from './mechanics/input';
import { PauseScreen } from './PauseScreen';
import { OptionsScreen } from '../screens/OptionsScreen';
import { Application } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { createArena, loadArenaAssets } from './arena/index';
import {
  startGameLoop,
  type GameLoopCallbacks,
  type GameLoopController,
} from './gameLoop';
import { COMBAT_CONFIG } from './mechanics/combat';
import type { MatchResult } from './mechanics/match';
import type { GameOptions } from './options';

function mountArena(
  app: Application,
  host: HTMLDivElement,
  textures: Awaited<ReturnType<typeof loadArenaAssets>>,
  options: GameOptions,
  callbacks: GameLoopCallbacks,
) {
  const arena = createArena(textures, app.screen.width, app.screen.height);
  app.stage.addChild(arena.container);
  app.canvas.setAttribute('aria-label', 'Naval battle arena');
  app.canvas.setAttribute('role', 'img');
  host.appendChild(app.canvas);
  app.render();
  return startGameLoop(app, arena, options, callbacks);
}

export function GameCanvas({
  onMatchEnd,
  options,
  savedOptions,
  onSaveOptions,
  onMainMenu,
}: {
  onMatchEnd: (result: MatchResult) => void;
  options: GameOptions;
  savedOptions: GameOptions;
  onSaveOptions: (options: GameOptions) => void;
  onMainMenu: () => void;
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
    options.sessionDuration,
  );
  const [paused, setPaused] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [input, setInput] = useState(createInputState);

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

        gameLoop = mountArena(app, host, textures, options, {
          onScoreChange: setScore,
          onInputChange: setInput,
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
  }, [attempt, onMatchEnd, options]);

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
      <div className="arena-stage" inert={paused}>
        <Hud
          score={score}
          health={health}
          maxHealth={COMBAT_CONFIG.playerHealth}
          remainingSeconds={remainingSeconds}
          paused={paused}
          ready={status === 'ready'}
          onTogglePause={togglePause}
          pauseButtonRef={pauseButtonRef}
        />
        <div ref={hostRef} className="arena" />
        <GameControls
          input={input}
          disabled={status !== 'ready' || paused}
          onAction={(action, active) =>
            gameLoopRef.current?.setControl(action, active)
          }
        />
      </div>
      {paused && (
        <PauseScreen>
          {showOptions ? (
            <OptionsScreen
              options={savedOptions}
              onSave={(nextOptions) => {
                onSaveOptions(nextOptions);
                setShowOptions(false);
              }}
            />
          ) : (
            <section className="menu pause-menu">
              <h2>Paused</h2>
              <p>Ready when you are.</p>
              <p className="sr-only" role="status">
                Game paused. Select Resume to continue.
              </p>
              <div className="menu-actions">
                <button autoFocus onClick={togglePause}>
                  Resume
                </button>
                <button onClick={() => setShowOptions(true)}>Options</button>
                <button onClick={onMainMenu}>Main Menu</button>
              </div>
            </section>
          )}
        </PauseScreen>
      )}
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
