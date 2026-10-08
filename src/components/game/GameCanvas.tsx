import { COMBAT_CONFIG } from '../../game/config';
import { Hud } from './Hud';
import { GameControls } from './GameControls';
import { createInputState } from '../../game/mechanics/input';
import { PauseMenu } from '../screens/PauseMenu';
import {
  createGameSession,
  type GameSessionController,
} from '../../game/createGameSession';
import { useEffect, useRef, useState } from 'react';

import type { MatchResult } from '../../game/mechanics/match';
import type { GameOptions } from '../../game/support/options';
import { usePortraitPrompt } from '../../hooks/usePortraitPrompt';
import { RotatePrompt } from '../screens/RotatePrompt';

interface GameCanvasProps {
  onMatchEnd: (result: MatchResult) => void;
  options: GameOptions;
  savedOptions: GameOptions;
  onSaveOptions: (options: GameOptions) => void;
  onMainMenu: () => void;
}

export function GameCanvas({
  onMatchEnd,
  options,
  savedOptions,
  onSaveOptions,
  onMainMenu,
}: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameSessionRef = useRef<GameSessionController | null>(null);
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
  const [input, setInput] = useState(createInputState);
  const { shouldPrompt, allowPortrait } = usePortraitPrompt();

  useEffect(() => {
    if (shouldPrompt && status === 'ready') {
      gameSessionRef.current?.pause();
    }
  }, [shouldPrompt, status]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const session = createGameSession(host, options, {
      onScoreChange: setScore,
      onInputChange: setInput,
      onHealthChange: setHealth,
      onTimeChange: setRemainingSeconds,
      onMatchEnd,
      onPauseChange(value) {
        setPaused(value);
        requestAnimationFrame(() => pauseButtonRef.current?.focus());
      },
      onReady: () => setStatus('ready'),
      onError(error) {
        console.error('Unable to initialize the arena.', error);
        setStatus('error');
      },
    });
    gameSessionRef.current = session;
    return () => {
      session.destroy();
      if (gameSessionRef.current === session) {
        gameSessionRef.current = null;
      }
    };
  }, [attempt, onMatchEnd, options]);

  function retry() {
    setStatus('loading');
    setAttempt((value) => value + 1);
  }

  function togglePause() {
    if (paused) {
      gameSessionRef.current?.resume();
    } else {
      gameSessionRef.current?.pause();
    }
  }

  return (
    <>
      <div
        className="arena-stage"
        inert={status !== 'ready' || paused || shouldPrompt}
      >
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
            gameSessionRef.current?.setControl(action, active)
          }
        />
      </div>
      {shouldPrompt && status === 'ready' && (
        <RotatePrompt onContinue={allowPortrait} onMainMenu={onMainMenu} />
      )}
      {paused && !shouldPrompt && (
        <PauseMenu
          options={savedOptions}
          onSaveOptions={onSaveOptions}
          onResume={togglePause}
          onMainMenu={onMainMenu}
        />
      )}
      {status === 'loading' && (
        <div className="arena-loading" role="status">
          <p>Loading arena...</p>
        </div>
      )}
      {status === 'error' && (
        <div className="arena-loading" role="alert">
          <p>Unable to load game assets or start the arena. Try again.</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}
    </>
  );
}
